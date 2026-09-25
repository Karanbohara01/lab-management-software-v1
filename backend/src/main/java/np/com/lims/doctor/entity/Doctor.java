package np.com.lims.doctor.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import np.com.lims.common.audit.BaseEntity;
import np.com.lims.common.tenant.TenantContext;
import org.hibernate.annotations.Filter;

@Entity
@Table(name = "doctor")
@Filter(name = "tenantFilter", condition = "organization_id = :tenantId")
public class Doctor extends BaseEntity {

    @Column(name = "organization_id", nullable = false, updatable = false)
    private Long organizationId;

    @Column(name = "full_name", nullable = false, length = 160)
    private String fullName;

    @Column(length = 120)
    private String specialization;

    @Column(length = 160)
    private String qualification;

    @Column(name = "nmc_number", length = 40)
    private String nmcNumber;

    @Column(length = 32)
    private String phone;

    @Column(length = 160)
    private String email;

    @Column(name = "affiliated_organization", length = 200)
    private String affiliatedOrganization;

    /** Percentage (0-100) of an invoice's taxable amount owed to this doctor for orders they referred. Null/zero = no commission. */
    @Column(name = "commission_rate", precision = 5, scale = 2)
    private java.math.BigDecimal commissionRate;

    @Column(nullable = false)
    private boolean active = true;

    protected Doctor() {
    }

    public static Doctor create(String fullName) {
        Doctor d = new Doctor();
        d.fullName = fullName;
        d.active = true;
        return d;
    }

    public void update(String fullName, String specialization, String qualification, String nmcNumber,
                       String phone, String email, String affiliatedOrganization, java.math.BigDecimal commissionRate) {
        this.fullName = fullName;
        this.specialization = specialization;
        this.qualification = qualification;
        this.nmcNumber = nmcNumber;
        this.phone = phone;
        this.email = email;
        this.affiliatedOrganization = affiliatedOrganization;
        this.commissionRate = commissionRate;
    }

    public void setActive(boolean active) {
        this.active = active;
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

    public String getFullName() {
        return fullName;
    }

    public String getSpecialization() {
        return specialization;
    }

    public String getQualification() {
        return qualification;
    }

    public String getNmcNumber() {
        return nmcNumber;
    }

    public String getPhone() {
        return phone;
    }

    public String getEmail() {
        return email;
    }

    public String getAffiliatedOrganization() {
        return affiliatedOrganization;
    }

    public java.math.BigDecimal getCommissionRate() {
        return commissionRate;
    }

    public boolean isActive() {
        return active;
    }
}
