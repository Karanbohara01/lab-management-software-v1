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

import java.math.BigDecimal;
import java.time.Instant;

/** An immutable receipt of money against an invoice. To reverse money, raise a {@link Refund}. */
@Entity
@Table(name = "payment")
public class Payment extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "invoice_id", nullable = false)
    private Invoice invoice;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private PaymentMethod method;

    @Column(length = 120)
    private String reference;

    @Column(length = 500)
    private String note;

    @Column(name = "received_by", nullable = false, length = 100)
    private String receivedBy;

    @Column(name = "received_at", nullable = false)
    private Instant receivedAt;

    @Column(nullable = false)
    private boolean reversed;

    protected Payment() {
    }

    Payment(Invoice invoice, BigDecimal amount, PaymentMethod method, String reference, String note, String receivedBy) {
        this.invoice = invoice;
        this.amount = amount;
        this.method = method;
        this.reference = reference;
        this.note = note;
        this.receivedBy = receivedBy;
        this.receivedAt = Instant.now();
    }

    public void markReversed() {
        this.reversed = true;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public PaymentMethod getMethod() {
        return method;
    }

    public String getReference() {
        return reference;
    }

    public String getNote() {
        return note;
    }

    public String getReceivedBy() {
        return receivedBy;
    }

    public Instant getReceivedAt() {
        return receivedAt;
    }

    public boolean isReversed() {
        return reversed;
    }
}
