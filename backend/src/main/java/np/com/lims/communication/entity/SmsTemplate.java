package np.com.lims.communication.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import np.com.lims.common.audit.BaseEntity;
import np.com.lims.common.tenant.TenantContext;
import org.hibernate.annotations.Filter;

/**
 * A reusable, organization-owned SMS message with {@code {placeholder}} tokens — see
 * {@code SmsPlaceholderResolver} for the supported set and how they're resolved per recipient.
 */
@Entity
@Table(name = "sms_template")
@Filter(name = "tenantFilter", condition = "organization_id = :tenantId")
public class SmsTemplate extends BaseEntity {

    @Column(name = "organization_id", nullable = false, updatable = false)
    private Long organizationId;

    @Column(name = "name", nullable = false, length = 160)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 32)
    private SmsCategory category;

    @Column(name = "body", nullable = false, length = 1000)
    private String body;

    @Column(name = "active", nullable = false)
    private boolean active = true;

    protected SmsTemplate() {
    }

    public static SmsTemplate create(String name, SmsCategory category, String body) {
        SmsTemplate t = new SmsTemplate();
        t.name = name;
        t.category = category;
        t.body = body;
        t.active = true;
        return t;
    }

    public void update(String name, SmsCategory category, String body) {
        this.name = name;
        this.category = category;
        this.body = body;
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

    public String getName() {
        return name;
    }

    public SmsCategory getCategory() {
        return category;
    }

    public String getBody() {
        return body;
    }

    public boolean isActive() {
        return active;
    }
}
