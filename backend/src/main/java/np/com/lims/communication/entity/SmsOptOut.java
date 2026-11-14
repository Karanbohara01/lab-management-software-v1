package np.com.lims.communication.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import np.com.lims.common.audit.BaseEntity;
import np.com.lims.common.tenant.TenantContext;
import org.hibernate.annotations.Filter;

/**
 * A phone number that has asked not to be contacted again. Keyed by the normalized phone number,
 * not by patient — see this entity's migration (V76) for why: a number can be shared by more than
 * one patient, or belong to no patient record at all (a raw CSV/custom-phone-list campaign
 * recipient), so "this number opted out" has to be a fact about the number, not a flag on one
 * patient row. {@code patientId} is kept only as an optional, non-authoritative cross-reference for
 * display.
 *
 * <p>Enforcement is a hard stop at {@code SmsMessageService#send} — the single choke point every
 * SMS attempt (manual, automated, campaign) already goes through — so there is no path that can
 * bypass it. To message this number again, staff must first remove it from the list.
 */
@Entity
@Table(name = "sms_opt_out")
@Filter(name = "tenantFilter", condition = "organization_id = :tenantId")
public class SmsOptOut extends BaseEntity {

    @Column(name = "organization_id", nullable = false, updatable = false)
    private Long organizationId;

    @Column(name = "phone", nullable = false, length = 20, updatable = false)
    private String phone;

    @Column(name = "patient_id")
    private Long patientId;

    @Column(name = "reason", length = 255)
    private String reason;

    @Column(name = "note", length = 500)
    private String note;

    protected SmsOptOut() {
    }

    public static SmsOptOut of(String phone, Long patientId, String reason, String note) {
        SmsOptOut o = new SmsOptOut();
        o.phone = phone;
        o.patientId = patientId;
        o.reason = reason;
        o.note = note;
        return o;
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

    public String getPhone() {
        return phone;
    }

    public Long getPatientId() {
        return patientId;
    }

    public String getReason() {
        return reason;
    }

    public String getNote() {
        return note;
    }
}
