package np.com.lims.platform.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import np.com.lims.common.audit.BaseEntity;
import np.com.lims.common.exception.ApiException;
import np.com.lims.ird.entity.CreditNoteStatus;
import np.com.lims.ird.entity.IrdStatus;

import java.time.Duration;
import java.time.Instant;

/**
 * IRD/CBMS submission tracking for a {@link SubscriptionInvoice} — what the PLATFORM charges a
 * CLINIC for its own subscription, filed with IRD the same way a clinic files its own patient
 * invoices (see {@code np.com.lims.ird.entity.IrdSubmission}, the pattern this mirrors). Reuses
 * {@link IrdStatus} and the same {@code np.com.lims.ird.gateway.IrdGateway} port unchanged — the
 * gateway is payload-driven and has no knowledge of which kind of invoice it's filing.
 *
 * <p>Deliberately simpler than {@code IrdSubmission}: no child attempts table, since subscription
 * invoice volume (one per clinic per billing period) is orders of magnitude lower than patient
 * invoice volume and a full per-attempt audit trail isn't needed — the platform's own audit log
 * already records every submit/retry/manual action against this row.
 *
 * <p>Deliberately NOT tenant-filtered, same as {@link SubscriptionInvoice} itself — this belongs to
 * the platform operator, not any one clinic's isolated dataset.
 */
@Entity
@Table(name = "platform_ird_submission")
public class PlatformIrdSubmission extends BaseEntity {

    @OneToOne(optional = false)
    @JoinColumn(name = "subscription_invoice_id", nullable = false, updatable = false)
    private SubscriptionInvoice subscriptionInvoice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private IrdStatus status = IrdStatus.NOT_SUBMITTED;

    @Column(name = "provider_reference", length = 120)
    private String providerReference;

    @Column(name = "last_error_code", length = 64)
    private String lastErrorCode;

    @Column(name = "last_error_message", length = 500)
    private String lastErrorMessage;

    /** Whether the last failure actually reached CBMS (a REJECTED response) vs. never left this
     * server (a TRANSPORT_ERROR — network/timeout/misconfigured) — only the latter is safe to
     * auto-retry unattended; a real REJECTED response means the data itself needs a human fix. */
    @Column(name = "last_failure_transmitted")
    private Boolean lastFailureTransmitted;

    @Column(name = "attempt_count", nullable = false)
    private int attemptCount;

    @Column(nullable = false)
    private boolean manual;

    @Column(name = "manual_reference", length = 120)
    private String manualReference;

    @Column(length = 1000)
    private String notes;

    @Column(name = "request_snapshot", columnDefinition = "json")
    private String requestSnapshot;

    @Column(name = "response_snapshot", columnDefinition = "json")
    private String responseSnapshot;

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @Column(name = "accepted_at")
    private Instant acceptedAt;

    @Column(name = "cancelled_at")
    private Instant cancelledAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "credit_note_status", nullable = false, length = 24)
    private CreditNoteStatus creditNoteStatus = CreditNoteStatus.NOT_NEEDED;

    @Column(name = "credit_note_number", length = 120)
    private String creditNoteNumber;

    @Column(name = "credit_note_filed_at")
    private Instant creditNoteFiledAt;

    @Column(name = "credit_note_error_code", length = 64)
    private String creditNoteErrorCode;

    @Column(name = "credit_note_error_message", length = 500)
    private String creditNoteErrorMessage;

    protected PlatformIrdSubmission() {
    }

    public static PlatformIrdSubmission trackFor(SubscriptionInvoice invoice) {
        PlatformIrdSubmission submission = new PlatformIrdSubmission();
        submission.subscriptionInvoice = invoice;
        submission.status = IrdStatus.NOT_SUBMITTED;
        return submission;
    }

    public void assertCanSubmit() {
        if (!status.canSubmit()) {
            throw ApiException.invalidTransition(
                    "Subscription bill " + subscriptionInvoice.invoiceNumber() + " is " + status
                            + " and cannot be (re)submitted");
        }
    }

    public void beginAttempt(String requestSnapshot) {
        this.attemptCount += 1;
        this.status = IrdStatus.PENDING;
        this.requestSnapshot = requestSnapshot;
    }

    public void recordAccepted(String providerReference, String responseSnapshot) {
        this.status = IrdStatus.ACCEPTED;
        this.providerReference = providerReference;
        this.acceptedAt = Instant.now();
        this.submittedAt = this.submittedAt == null ? Instant.now() : this.submittedAt;
        this.lastErrorCode = null;
        this.lastErrorMessage = null;
        this.responseSnapshot = responseSnapshot;
    }

    public void recordDuplicate(String providerReference, String responseSnapshot) {
        this.status = IrdStatus.DUPLICATE;
        this.providerReference = providerReference;
        this.submittedAt = this.submittedAt == null ? Instant.now() : this.submittedAt;
        this.responseSnapshot = responseSnapshot;
    }

    public void recordFailure(boolean transmitted, String errorCode, String errorMessage, String responseSnapshot) {
        this.status = IrdStatus.FAILED;
        this.lastErrorCode = errorCode;
        this.lastErrorMessage = errorMessage;
        this.lastFailureTransmitted = transmitted;
        this.responseSnapshot = responseSnapshot;
    }

    public void recordManual(String actor, String reference, String note) {
        if (status.isTerminalSuccess()) {
            throw ApiException.invalidTransition("Subscription bill is already " + status);
        }
        this.status = IrdStatus.SUBMITTED;
        this.manual = true;
        this.manualReference = reference;
        this.submittedAt = Instant.now();
        this.notes = note;
        this.attemptCount += 1;
    }

    /**
     * Eligible for the unattended auto-retry sweep only when the last attempt was a transport
     * failure (the gateway/network was unreachable) — a REJECTED response means IRD itself
     * rejected the data, which a blind retry can't fix. Mirrors {@code IrdSubmission}'s identical
     * method exactly (see its javadoc for the full rationale).
     */
    public boolean isAutoRetryEligible(int maxAttempts, Duration minBackoff, Instant lastAttemptAt) {
        if (status != IrdStatus.FAILED || attemptCount >= maxAttempts) {
            return false;
        }
        if (lastFailureTransmitted == null || lastFailureTransmitted) {
            return false;
        }
        return lastAttemptAt == null || lastAttemptAt.isBefore(Instant.now().minus(minBackoff));
    }

    /**
     * The invoice was cancelled. If the bill was never successfully filed with IRD, there is
     * nothing to reverse — mark this tracking row cancelled outright. If it WAS filed
     * (ACCEPTED/DUPLICATE), flag {@link CreditNoteStatus#NEEDED} instead — filing the credit note
     * is a separate, explicit, staff-triggered action, never an automatic side effect of
     * cancelling an invoice (same non-blocking principle as everywhere else in this gateway).
     */
    public void cancel() {
        if (status.isTerminalSuccess()) {
            if (creditNoteStatus != CreditNoteStatus.FILED) {
                creditNoteStatus = CreditNoteStatus.NEEDED;
            }
            return;
        }
        if (status != IrdStatus.CANCELLED) {
            this.status = IrdStatus.CANCELLED;
            this.cancelledAt = Instant.now();
        }
    }

    public void assertCanSubmitCreditNote() {
        if (creditNoteStatus != CreditNoteStatus.NEEDED && creditNoteStatus != CreditNoteStatus.FAILED) {
            throw ApiException.invalidTransition(
                    "Subscription bill " + subscriptionInvoice.invoiceNumber() + " has no credit note to file (status "
                            + creditNoteStatus + ")");
        }
    }

    public void beginCreditNoteAttempt() {
        this.attemptCount += 1;
    }

    public void recordCreditNoteFiled(String creditNoteNumber, String providerReference) {
        this.creditNoteStatus = CreditNoteStatus.FILED;
        this.creditNoteNumber = creditNoteNumber;
        this.creditNoteFiledAt = Instant.now();
        this.creditNoteErrorCode = null;
        this.creditNoteErrorMessage = null;
        if (providerReference != null) {
            this.providerReference = providerReference;
        }
    }

    public void recordCreditNoteFailed(String errorCode, String errorMessage) {
        this.creditNoteStatus = CreditNoteStatus.FAILED;
        this.creditNoteErrorCode = errorCode;
        this.creditNoteErrorMessage = errorMessage;
    }

    public void recordCreditNoteManual(String creditNoteNumber, String note) {
        if (creditNoteStatus != CreditNoteStatus.NEEDED && creditNoteStatus != CreditNoteStatus.FAILED) {
            throw ApiException.invalidTransition("Subscription bill credit note is already " + creditNoteStatus);
        }
        this.creditNoteStatus = CreditNoteStatus.FILED;
        this.creditNoteNumber = creditNoteNumber;
        this.creditNoteFiledAt = Instant.now();
        this.creditNoteErrorCode = null;
        this.creditNoteErrorMessage = null;
        this.notes = note;
        this.attemptCount += 1;
    }

    public SubscriptionInvoice getSubscriptionInvoice() {
        return subscriptionInvoice;
    }

    public IrdStatus getStatus() {
        return status;
    }

    public String getProviderReference() {
        return providerReference;
    }

    public String getLastErrorCode() {
        return lastErrorCode;
    }

    public String getLastErrorMessage() {
        return lastErrorMessage;
    }

    public int getAttemptCount() {
        return attemptCount;
    }

    public boolean isManual() {
        return manual;
    }

    public String getManualReference() {
        return manualReference;
    }

    public String getNotes() {
        return notes;
    }

    public Instant getSubmittedAt() {
        return submittedAt;
    }

    public Instant getAcceptedAt() {
        return acceptedAt;
    }

    public Instant getCancelledAt() {
        return cancelledAt;
    }

    public CreditNoteStatus getCreditNoteStatus() {
        return creditNoteStatus;
    }

    public String getCreditNoteNumber() {
        return creditNoteNumber;
    }

    public Instant getCreditNoteFiledAt() {
        return creditNoteFiledAt;
    }

    public String getCreditNoteErrorCode() {
        return creditNoteErrorCode;
    }

    public String getCreditNoteErrorMessage() {
        return creditNoteErrorMessage;
    }
}
