package np.com.lims.ird.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.OrderBy;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import np.com.lims.billing.entity.Invoice;
import np.com.lims.common.audit.BaseEntity;
import np.com.lims.common.exception.ApiException;
import np.com.lims.common.tenant.TenantContext;
import org.hibernate.annotations.Filter;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/** Per-invoice IRD/CBMS submission tracking. Never triggers an API call on its own. */
@Entity
@Table(name = "ird_submission")
@Filter(name = "tenantFilter", condition = "organization_id = :tenantId")
public class IrdSubmission extends BaseEntity {

    @Column(name = "organization_id", nullable = false, updatable = false)
    private Long organizationId;

    @OneToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "invoice_id", nullable = false, updatable = false)
    private Invoice invoice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private IrdStatus status = IrdStatus.NOT_SUBMITTED;

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

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @Column(name = "accepted_at")
    private Instant acceptedAt;

    @Column(name = "cancelled_at")
    private Instant cancelledAt;

    @OneToMany(mappedBy = "submission", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("occurredAt ASC, id ASC")
    private List<IrdSubmissionAttempt> attempts = new ArrayList<>();

    protected IrdSubmission() {
    }

    public static IrdSubmission trackFor(Invoice invoice) {
        IrdSubmission submission = new IrdSubmission();
        submission.invoice = invoice;
        submission.status = IrdStatus.NOT_SUBMITTED;
        return submission;
    }

    /**
     * Eligible for the unattended auto-retry sweep only when the LAST attempt was a transport
     * failure (network/timeout/gateway-unreachable) — a {@code REJECTED} response means IRD itself
     * rejected the data (bad credentials, bad fields), which a blind retry can never fix and would
     * just burn attempts on; that case still needs a human. Also caps total attempts and enforces
     * a minimum backoff since the last try, so a prolonged outage produces occasional retries
     * rather than a tight retry storm every sweep tick.
     */
    public boolean isAutoRetryEligible(int maxAttempts, java.time.Duration minBackoff) {
        if (status != IrdStatus.FAILED || attemptCount >= maxAttempts) {
            return false;
        }
        IrdSubmissionAttempt last = attempts.isEmpty() ? null : attempts.get(attempts.size() - 1);
        if (last == null || last.getResponseStatus() != IrdSubmissionAttempt.ResponseStatus.TRANSPORT_ERROR) {
            return false;
        }
        return last.getOccurredAt().isBefore(Instant.now().minus(minBackoff));
    }

    public void assertCanSubmit() {
        if (!status.canSubmit()) {
            throw ApiException.invalidTransition(
                    "Bill for invoice " + invoice.getInvoiceNumber() + " is " + status
                            + " and cannot be (re)submitted");
        }
    }

    public IrdSubmissionAttempt beginAttempt(IrdSubmissionAttempt.Action action, String actor, String requestSnapshot) {
        this.attemptCount += 1;
        this.status = IrdStatus.PENDING;
        IrdSubmissionAttempt attempt = new IrdSubmissionAttempt(this, attemptCount, action,
                IrdSubmissionAttempt.RequestStatus.PREPARED, null, null, null, null, actor, requestSnapshot, null);
        attempts.add(attempt);
        return attempt;
    }

    public void recordAccepted(IrdSubmissionAttempt attempt, String providerReference, String responseSnapshot) {
        this.status = IrdStatus.ACCEPTED;
        this.providerReference = providerReference;
        this.acceptedAt = Instant.now();
        this.submittedAt = this.submittedAt == null ? Instant.now() : this.submittedAt;
        this.lastErrorCode = null;
        this.lastErrorMessage = null;
        finish(attempt, IrdSubmissionAttempt.RequestStatus.SENT,
                IrdSubmissionAttempt.ResponseStatus.ACCEPTED, providerReference, null, null, responseSnapshot);
    }

    public void recordDuplicate(IrdSubmissionAttempt attempt, String providerReference, String responseSnapshot) {
        this.status = IrdStatus.DUPLICATE;
        this.providerReference = providerReference;
        this.submittedAt = this.submittedAt == null ? Instant.now() : this.submittedAt;
        finish(attempt, IrdSubmissionAttempt.RequestStatus.SENT,
                IrdSubmissionAttempt.ResponseStatus.DUPLICATE, providerReference, null, null, responseSnapshot);
    }

    public void recordFailure(IrdSubmissionAttempt attempt, boolean transmitted, String errorCode,
                              String errorMessage, String responseSnapshot) {
        this.status = IrdStatus.FAILED;
        this.lastErrorCode = errorCode;
        this.lastErrorMessage = errorMessage;
        finish(attempt,
                transmitted ? IrdSubmissionAttempt.RequestStatus.SENT : IrdSubmissionAttempt.RequestStatus.SKIPPED,
                transmitted ? IrdSubmissionAttempt.ResponseStatus.REJECTED
                        : IrdSubmissionAttempt.ResponseStatus.TRANSPORT_ERROR,
                null, errorCode, errorMessage, responseSnapshot);
    }

    public void recordManual(String actor, String reference, String note) {
        if (status.isTerminalSuccess()) {
            throw ApiException.invalidTransition("Bill is already " + status);
        }
        this.status = IrdStatus.SUBMITTED;
        this.manual = true;
        this.manualReference = reference;
        this.submittedAt = Instant.now();
        this.notes = note;
        this.attemptCount += 1;
        attempts.add(new IrdSubmissionAttempt(this, attemptCount, IrdSubmissionAttempt.Action.MANUAL,
                IrdSubmissionAttempt.RequestStatus.SKIPPED, IrdSubmissionAttempt.ResponseStatus.NOT_APPLICABLE,
                reference, null, null, actor, null, null));
    }

    /**
     * The invoice was cancelled. If the bill was never successfully filed with IRD, there is
     * nothing to reverse — mark this tracking row cancelled outright. If it WAS filed
     * (ACCEPTED/DUPLICATE), it must instead be reversed with a credit note — flag that as
     * {@link CreditNoteStatus#NEEDED} rather than transmitting anything here; filing the credit
     * note is a separate, explicit, staff-triggered action (see class javadoc / gateway
     * contract: an external call must never happen inside the billing transaction).
     */
    public void cancel(String actor, String reason) {
        if (status.isTerminalSuccess()) {
            if (creditNoteStatus != CreditNoteStatus.FILED) {
                creditNoteStatus = CreditNoteStatus.NEEDED;
            }
            return;
        }
        if (status == IrdStatus.CANCELLED) {
            return;
        }
        this.status = IrdStatus.CANCELLED;
        this.cancelledAt = Instant.now();
        this.notes = reason;
        this.attemptCount += 1;
        attempts.add(new IrdSubmissionAttempt(this, attemptCount, IrdSubmissionAttempt.Action.CANCEL,
                IrdSubmissionAttempt.RequestStatus.SKIPPED, IrdSubmissionAttempt.ResponseStatus.NOT_APPLICABLE,
                null, null, reason, actor, null, null));
    }

    public void assertCanSubmitCreditNote() {
        if (creditNoteStatus != CreditNoteStatus.NEEDED && creditNoteStatus != CreditNoteStatus.FAILED) {
            throw ApiException.invalidTransition(
                    "Bill for invoice " + invoice.getInvoiceNumber() + " has no credit note to file (status "
                            + creditNoteStatus + ")");
        }
    }

    public IrdSubmissionAttempt beginCreditNoteAttempt(IrdSubmissionAttempt.Action action, String actor,
                                                        String requestSnapshot) {
        this.attemptCount += 1;
        IrdSubmissionAttempt attempt = new IrdSubmissionAttempt(this, attemptCount, action,
                IrdSubmissionAttempt.RequestStatus.PREPARED, null, null, null, null, actor, requestSnapshot, null);
        attempts.add(attempt);
        return attempt;
    }

    public void recordCreditNoteFiled(IrdSubmissionAttempt attempt, String creditNoteNumber,
                                      String providerReference, String responseSnapshot) {
        this.creditNoteStatus = CreditNoteStatus.FILED;
        this.creditNoteNumber = creditNoteNumber;
        this.creditNoteFiledAt = Instant.now();
        this.creditNoteErrorCode = null;
        this.creditNoteErrorMessage = null;
        finish(attempt, IrdSubmissionAttempt.RequestStatus.SENT,
                IrdSubmissionAttempt.ResponseStatus.ACCEPTED, providerReference, null, null, responseSnapshot);
    }

    public void recordCreditNoteFailed(IrdSubmissionAttempt attempt, boolean transmitted, String errorCode,
                                       String errorMessage, String responseSnapshot) {
        this.creditNoteStatus = CreditNoteStatus.FAILED;
        this.creditNoteErrorCode = errorCode;
        this.creditNoteErrorMessage = errorMessage;
        finish(attempt,
                transmitted ? IrdSubmissionAttempt.RequestStatus.SENT : IrdSubmissionAttempt.RequestStatus.SKIPPED,
                transmitted ? IrdSubmissionAttempt.ResponseStatus.REJECTED
                        : IrdSubmissionAttempt.ResponseStatus.TRANSPORT_ERROR,
                null, errorCode, errorMessage, responseSnapshot);
    }

    private void finish(IrdSubmissionAttempt attempt, IrdSubmissionAttempt.RequestStatus reqStatus,
                        IrdSubmissionAttempt.ResponseStatus respStatus, String providerReference,
                        String errorCode, String errorMessage, String responseSnapshot) {
        attempt.complete(reqStatus, respStatus, providerReference, errorCode, errorMessage, responseSnapshot);
    }

    @PrePersist
    private void assignTenant() {
        if (organizationId == null) {
            organizationId = TenantContext.require();
        }
    }

    public Long getOrganizationId() {
        return organizationId;
    }

    public Invoice getInvoice() {
        return invoice;
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

    public List<IrdSubmissionAttempt> getAttempts() {
        return attempts;
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
