package np.com.lims.communication.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import np.com.lims.common.audit.BaseEntity;
import np.com.lims.common.tenant.TenantContext;
import org.hibernate.annotations.Filter;

/**
 * One organization's on/off switch + template for a given {@link SmsAutomationEvent}. Disabled
 * (not deleted) by default for every event — the feature deliberately does not assume a hospital
 * wants every automated message turned on; an administrator opts each one in.
 */
@Entity
@Table(name = "sms_automation_rule")
@Filter(name = "tenantFilter", condition = "organization_id = :tenantId")
public class SmsAutomationRule extends BaseEntity {

    @Column(name = "organization_id", nullable = false, updatable = false)
    private Long organizationId;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 40)
    private SmsAutomationEvent eventType;

    @Column(name = "enabled", nullable = false)
    private boolean enabled = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id")
    private SmsTemplate template;

    /** Only meaningful for {@link SmsAutomationEvent#APPOINTMENT_REMINDER}. */
    @Column(name = "reminder_offset_hours")
    private Integer reminderOffsetHours;

    protected SmsAutomationRule() {
    }

    public static SmsAutomationRule createFor(SmsAutomationEvent eventType) {
        SmsAutomationRule r = new SmsAutomationRule();
        r.eventType = eventType;
        r.enabled = false;
        return r;
    }

    public static SmsAutomationRule createForOrganization(Long organizationId, SmsAutomationEvent eventType, boolean enabled, SmsTemplate template, Integer reminderOffsetHours) {
        SmsAutomationRule r = new SmsAutomationRule();
        r.organizationId = organizationId;
        r.eventType = eventType;
        r.enabled = enabled;
        r.template = template;
        r.reminderOffsetHours = reminderOffsetHours;
        return r;
    }

    public void update(boolean enabled, SmsTemplate template, Integer reminderOffsetHours) {
        this.enabled = enabled;
        this.template = template;
        this.reminderOffsetHours = reminderOffsetHours;
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

    public SmsAutomationEvent getEventType() {
        return eventType;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public SmsTemplate getTemplate() {
        return template;
    }

    public Integer getReminderOffsetHours() {
        return reminderOffsetHours;
    }
}
