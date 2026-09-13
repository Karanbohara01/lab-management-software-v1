package np.com.lims.messaging.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import np.com.lims.common.audit.BaseEntity;
import np.com.lims.common.tenant.TenantContext;
import org.hibernate.annotations.Filter;

/**
 * One organization's own Sparrow SMS account, overriding this deployment's shared
 * application.yml config for that org only — same pattern as
 * {@code np.com.lims.payment.entity.PaymentCredentials} / {@code IrdCredentials}.
 */
@Entity
@Table(name = "sms_credentials")
@Filter(name = "tenantFilter", condition = "organization_id = :tenantId")
public class SmsCredentials extends BaseEntity {

    @Column(name = "organization_id", nullable = false, updatable = false)
    private Long organizationId;

    @Column(name = "sms_enabled", nullable = false)
    private boolean smsEnabled;

    @Column(name = "sms_from", length = 40)
    private String smsFrom;

    @Column(name = "sms_token_enc", length = 500)
    private String smsTokenEncrypted;

    protected SmsCredentials() {
    }

    public static SmsCredentials createFor(Long organizationId) {
        SmsCredentials c = new SmsCredentials();
        c.organizationId = organizationId;
        return c;
    }

    public void update(boolean enabled, String from, String tokenEncryptedOrNull) {
        this.smsEnabled = enabled;
        this.smsFrom = from;
        if (tokenEncryptedOrNull != null) {
            this.smsTokenEncrypted = tokenEncryptedOrNull;
        }
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

    public boolean isSmsEnabled() {
        return smsEnabled;
    }

    public String getSmsFrom() {
        return smsFrom;
    }

    public String getSmsTokenEncrypted() {
        return smsTokenEncrypted;
    }

    public boolean fullyConfigured() {
        return smsEnabled && hasText(smsFrom) && hasText(smsTokenEncrypted);
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
