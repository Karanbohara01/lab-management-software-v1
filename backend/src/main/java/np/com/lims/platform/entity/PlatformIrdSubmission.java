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
import np.com.lims.ird.entity.IrdStatus;

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

    public void recordFailure(String errorCode, String errorMessage, String responseSnapshot) {
        this.status = IrdStatus.FAILED;
        this.lastErrorCode = errorCode;
        this.lastErrorMessage = errorMessage;
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
}
