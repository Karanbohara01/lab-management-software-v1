package np.com.lims.payment.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import np.com.lims.billing.entity.Invoice;
import np.com.lims.billing.entity.Payment;
import np.com.lims.common.audit.BaseEntity;
import np.com.lims.common.exception.ApiException;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * One online checkout attempt against an invoice via a gateway (eSewa/Khalti). On a
 * server-verified success this results in a real {@link Payment} (never trust the browser
 * redirect alone — {@link #verify} always follows a server-to-server status check with the
 * gateway before recording money).
 */
@Entity
@Table(name = "online_payment")
public class OnlinePayment extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "invoice_id", nullable = false, updatable = false)
    private Invoice invoice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24, updatable = false)
    private PaymentProvider provider;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private OnlinePaymentStatus status;

    @Column(nullable = false, precision = 12, scale = 2, updatable = false)
    private BigDecimal amount;

    /** Our own idempotency key, sent to the gateway and used to look the transaction back up. */
    @Column(name = "transaction_uuid", nullable = false, length = 120, updatable = false)
    private String transactionUuid;

    /** The gateway's own reference for the completed transaction (eSewa refId / Khalti pidx), once known. */
    @Column(name = "provider_reference", length = 120)
    private String providerReference;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_id")
    private Payment payment;

    @Column(name = "initiated_at", nullable = false, updatable = false)
    private Instant initiatedAt;

    @Column(name = "initiated_by", nullable = false, length = 100, updatable = false)
    private String initiatedBy;

    @Column(name = "verified_at")
    private Instant verifiedAt;

    @Column(name = "failure_reason", length = 500)
    private String failureReason;

    @Column(name = "initiate_response")
    private String initiateResponse;

    @Column(name = "verify_response")
    private String verifyResponse;

    protected OnlinePayment() {
    }

    public static OnlinePayment initiate(Invoice invoice, PaymentProvider provider, BigDecimal amount,
                                         String transactionUuid, String actor) {
        OnlinePayment op = new OnlinePayment();
        op.invoice = invoice;
        op.provider = provider;
        op.status = OnlinePaymentStatus.INITIATED;
        op.amount = amount;
        op.transactionUuid = transactionUuid;
        op.initiatedAt = Instant.now();
        op.initiatedBy = actor;
        return op;
    }

    public void recordInitiateResponse(String raw) {
        this.initiateResponse = raw;
    }

    /**
     * Captures the gateway's own transaction identifier as soon as it's known at initiate time
     * (Khalti's {@code pidx}) — needed later at {@link #assertCanVerify} time because Khalti's
     * lookup call takes that identifier, not our own {@link #transactionUuid}.
     */
    public void recordProviderReference(String reference) {
        this.providerReference = reference;
    }

    public void assertCanVerify() {
        if (status != OnlinePaymentStatus.INITIATED) {
            throw ApiException.invalidTransition("This online payment is already " + status);
        }
    }

    public void markVerified(String providerReference, Payment payment, String rawResponse) {
        this.status = OnlinePaymentStatus.VERIFIED;
        this.providerReference = providerReference;
        this.payment = payment;
        this.verifiedAt = Instant.now();
        this.verifyResponse = rawResponse;
    }

    public void markFailed(String reason, String rawResponse) {
        this.status = OnlinePaymentStatus.FAILED;
        this.failureReason = reason;
        this.verifiedAt = Instant.now();
        this.verifyResponse = rawResponse;
    }

    public Invoice getInvoice() {
        return invoice;
    }

    public PaymentProvider getProvider() {
        return provider;
    }

    public OnlinePaymentStatus getStatus() {
        return status;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public String getTransactionUuid() {
        return transactionUuid;
    }

    public String getProviderReference() {
        return providerReference;
    }

    public Payment getPayment() {
        return payment;
    }

    public Instant getInitiatedAt() {
        return initiatedAt;
    }

    public String getInitiatedBy() {
        return initiatedBy;
    }

    public Instant getVerifiedAt() {
        return verifiedAt;
    }

    public String getFailureReason() {
        return failureReason;
    }
}
