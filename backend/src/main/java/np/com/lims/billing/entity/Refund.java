package np.com.lims.billing.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import np.com.lims.common.audit.BaseEntity;
import np.com.lims.common.exception.ApiException;

import java.math.BigDecimal;
import java.time.Instant;

/** A controlled refund. Requested by one user, approved/rejected by another (segregation of duties). */
@Entity
@Table(name = "refund")
public class Refund extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "invoice_id", nullable = false)
    private Invoice invoice;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_id")
    private Payment payment;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, length = 500)
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private RefundStatus status = RefundStatus.REQUESTED;

    @Column(name = "requested_by", nullable = false, length = 100)
    private String requestedBy;

    @Column(name = "requested_at", nullable = false)
    private Instant requestedAt;

    @Column(name = "decided_by", length = 100)
    private String decidedBy;

    @Column(name = "decided_at")
    private Instant decidedAt;

    @Column(name = "decision_note", length = 500)
    private String decisionNote;

    protected Refund() {
    }

    Refund(Invoice invoice, Payment payment, BigDecimal amount, String reason, String requestedBy) {
        this.invoice = invoice;
        this.payment = payment;
        this.amount = amount;
        this.reason = reason;
        this.requestedBy = requestedBy;
        this.requestedAt = Instant.now();
        this.status = RefundStatus.REQUESTED;
    }

    public void approve(String actor, String note) {
        assertPending();
        this.status = RefundStatus.APPROVED;
        this.decidedBy = actor;
        this.decidedAt = Instant.now();
        this.decisionNote = note;
    }

    public void reject(String actor, String note) {
        assertPending();
        this.status = RefundStatus.REJECTED;
        this.decidedBy = actor;
        this.decidedAt = Instant.now();
        this.decisionNote = note;
    }

    private void assertPending() {
        if (status != RefundStatus.REQUESTED) {
            throw ApiException.invalidTransition("Refund has already been " + status.name().toLowerCase());
        }
    }

    public Invoice getInvoice() {
        return invoice;
    }

    public Payment getPayment() {
        return payment;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public String getReason() {
        return reason;
    }

    public RefundStatus getStatus() {
        return status;
    }

    public String getRequestedBy() {
        return requestedBy;
    }

    public Instant getRequestedAt() {
        return requestedAt;
    }

    public String getDecidedBy() {
        return decidedBy;
    }

    public Instant getDecidedAt() {
        return decidedAt;
    }

    public String getDecisionNote() {
        return decisionNote;
    }
}
