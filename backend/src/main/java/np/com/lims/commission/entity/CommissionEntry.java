package np.com.lims.commission.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import np.com.lims.common.audit.BaseEntity;
import np.com.lims.common.tenant.TenantContext;
import org.hibernate.annotations.Filter;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * One referring doctor's earned commission on one issued invoice — an immutable ledger row,
 * created once when the invoice is issued (never edited or deleted; a cancelled/refunded invoice
 * doesn't retroactively erase this, mirroring how the invoice itself stays immutable once issued).
 * {@code baseAmount} is the invoice's taxable amount (pre-VAT) — commission is a share of the
 * lab's actual revenue, not of the tax collected on the government's behalf.
 */
@Entity
@Table(name = "commission_entry")
@Filter(name = "tenantFilter", condition = "organization_id = :tenantId")
public class CommissionEntry extends BaseEntity {

    @Column(name = "organization_id", nullable = false, updatable = false)
    private Long organizationId;

    @Column(name = "doctor_id", nullable = false, updatable = false)
    private Long doctorId;

    @Column(name = "invoice_id", nullable = false, updatable = false)
    private Long invoiceId;

    @Column(name = "invoice_number", nullable = false, length = 40, updatable = false)
    private String invoiceNumber;

    @Column(name = "order_id", nullable = false, updatable = false)
    private Long orderId;

    @Column(name = "order_number", nullable = false, length = 40, updatable = false)
    private String orderNumber;

    @Column(name = "base_amount", nullable = false, precision = 12, scale = 2, updatable = false)
    private BigDecimal baseAmount;

    @Column(nullable = false, precision = 5, scale = 2, updatable = false)
    private BigDecimal rate;

    @Column(name = "commission_amount", nullable = false, precision = 12, scale = 2, updatable = false)
    private BigDecimal commissionAmount;

    @Column(name = "earned_at", nullable = false, updatable = false)
    private Instant earnedAt;

    protected CommissionEntry() {
    }

    public static CommissionEntry earn(Long doctorId, Long invoiceId, String invoiceNumber, Long orderId,
                                       String orderNumber, BigDecimal baseAmount, BigDecimal rate) {
        CommissionEntry e = new CommissionEntry();
        e.doctorId = doctorId;
        e.invoiceId = invoiceId;
        e.invoiceNumber = invoiceNumber;
        e.orderId = orderId;
        e.orderNumber = orderNumber;
        e.baseAmount = baseAmount;
        e.rate = rate;
        e.commissionAmount = baseAmount.multiply(rate).divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
        e.earnedAt = Instant.now();
        return e;
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

    public Long getDoctorId() {
        return doctorId;
    }

    public Long getInvoiceId() {
        return invoiceId;
    }

    public String getInvoiceNumber() {
        return invoiceNumber;
    }

    public Long getOrderId() {
        return orderId;
    }

    public String getOrderNumber() {
        return orderNumber;
    }

    public BigDecimal getBaseAmount() {
        return baseAmount;
    }

    public BigDecimal getRate() {
        return rate;
    }

    public BigDecimal getCommissionAmount() {
        return commissionAmount;
    }

    public Instant getEarnedAt() {
        return earnedAt;
    }
}
