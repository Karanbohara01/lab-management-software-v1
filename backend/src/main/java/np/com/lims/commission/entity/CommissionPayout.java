package np.com.lims.commission.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import np.com.lims.billing.entity.PaymentMethod;
import np.com.lims.common.audit.BaseEntity;
import np.com.lims.common.tenant.TenantContext;
import org.hibernate.annotations.Filter;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * A settlement payment made to a referring doctor for accrued commission — a separate ledger from
 * {@link CommissionEntry}, not matched 1:1 to specific invoices (labs typically pay a lump sum
 * periodically, e.g. monthly, not per invoice). A doctor's outstanding balance is simply
 * sum(their CommissionEntry.commissionAmount) - sum(their CommissionPayout.amount).
 */
@Entity
@Table(name = "commission_payout")
@Filter(name = "tenantFilter", condition = "organization_id = :tenantId")
public class CommissionPayout extends BaseEntity {

    @Column(name = "organization_id", nullable = false, updatable = false)
    private Long organizationId;

    @Column(name = "doctor_id", nullable = false, updatable = false)
    private Long doctorId;

    @Column(nullable = false, precision = 12, scale = 2, updatable = false)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24, updatable = false)
    private PaymentMethod method;

    @Column(length = 120, updatable = false)
    private String reference;

    @Column(length = 500, updatable = false)
    private String note;

    @Column(name = "paid_at", nullable = false, updatable = false)
    private Instant paidAt;

    @Column(name = "paid_by", nullable = false, length = 100, updatable = false)
    private String paidBy;

    protected CommissionPayout() {
    }

    public static CommissionPayout record(Long doctorId, BigDecimal amount, PaymentMethod method,
                                          String reference, String note, String actor) {
        CommissionPayout p = new CommissionPayout();
        p.doctorId = doctorId;
        p.amount = amount;
        p.method = method;
        p.reference = reference;
        p.note = note;
        p.paidAt = Instant.now();
        p.paidBy = actor;
        return p;
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

    public Instant getPaidAt() {
        return paidAt;
    }

    public String getPaidBy() {
        return paidBy;
    }
}
