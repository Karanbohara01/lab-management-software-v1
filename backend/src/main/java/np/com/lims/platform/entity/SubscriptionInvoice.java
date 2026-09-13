package np.com.lims.platform.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import np.com.lims.common.audit.BaseEntity;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * One billing period's charge for a clinic's subscription — what the PLATFORM charges the CLINIC,
 * never to be confused with {@code np.com.lims.billing.entity.Invoice} (what a clinic charges its
 * own patients). Deliberately NOT tenant-filtered (see this table's migration comment) — the
 * platform admin needs to see every organization's invoices at once; a clinic's own "my billing"
 * view scopes explicitly by {@code organizationId} instead of relying on a Hibernate filter.
 */
@Entity
@Table(name = "subscription_invoice")
public class SubscriptionInvoice extends BaseEntity {

    @Column(name = "organization_id", nullable = false, updatable = false)
    private Long organizationId;

    @Column(name = "subscription_id", nullable = false, updatable = false)
    private Long subscriptionId;

    @Column(name = "plan_code", nullable = false, length = 40, updatable = false)
    private String planCode;

    @Column(name = "plan_name", nullable = false, length = 120, updatable = false)
    private String planName;

    @Column(nullable = false, precision = 12, scale = 2, updatable = false)
    private BigDecimal amount;

    @Column(name = "period_start", nullable = false, updatable = false)
    private Instant periodStart;

    @Column(name = "period_end", nullable = false, updatable = false)
    private Instant periodEnd;

    @Column(name = "due_at", nullable = false, updatable = false)
    private Instant dueAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SubscriptionInvoiceStatus status = SubscriptionInvoiceStatus.PENDING;

    @Column(name = "paid_at")
    private Instant paidAt;

    @Column(name = "payment_reference", length = 200)
    private String paymentReference;

    @Column(name = "pending_transaction_uuid", length = 80)
    private String pendingTransactionUuid;

    protected SubscriptionInvoice() {
    }

    public static SubscriptionInvoice issue(Long organizationId, Long subscriptionId, String planCode,
                                            String planName, BigDecimal amount, Instant periodStart,
                                            Instant periodEnd, Instant dueAt) {
        SubscriptionInvoice inv = new SubscriptionInvoice();
        inv.organizationId = organizationId;
        inv.subscriptionId = subscriptionId;
        inv.planCode = planCode;
        inv.planName = planName;
        inv.amount = amount;
        inv.periodStart = periodStart;
        inv.periodEnd = periodEnd;
        inv.dueAt = dueAt;
        inv.status = SubscriptionInvoiceStatus.PENDING;
        return inv;
    }

    /** Display number — computed, not persisted, since it's derived entirely from the row's own id. */
    public String invoiceNumber() {
        return "SUBINV-%06d".formatted(getId());
    }

    public void recordCheckoutAttempt(String transactionUuid) {
        this.pendingTransactionUuid = transactionUuid;
    }

    public void markPaid(String paymentReference) {
        this.status = SubscriptionInvoiceStatus.PAID;
        this.paidAt = Instant.now();
        this.paymentReference = paymentReference;
    }

    public void markOverdue() {
        if (this.status == SubscriptionInvoiceStatus.PENDING) {
            this.status = SubscriptionInvoiceStatus.OVERDUE;
        }
    }

    public void cancel() {
        this.status = SubscriptionInvoiceStatus.CANCELLED;
    }

    public boolean isSettled() {
        return status == SubscriptionInvoiceStatus.PAID || status == SubscriptionInvoiceStatus.CANCELLED;
    }

    public Long getOrganizationId() {
        return organizationId;
    }

    public Long getSubscriptionId() {
        return subscriptionId;
    }

    public String getPlanCode() {
        return planCode;
    }

    public String getPlanName() {
        return planName;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public Instant getPeriodStart() {
        return periodStart;
    }

    public Instant getPeriodEnd() {
        return periodEnd;
    }

    public Instant getDueAt() {
        return dueAt;
    }

    public SubscriptionInvoiceStatus getStatus() {
        return status;
    }

    public Instant getPaidAt() {
        return paidAt;
    }

    public String getPaymentReference() {
        return paymentReference;
    }

    public String getPendingTransactionUuid() {
        return pendingTransactionUuid;
    }
}
