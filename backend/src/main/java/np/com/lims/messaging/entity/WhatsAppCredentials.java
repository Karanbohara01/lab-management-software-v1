package np.com.lims.messaging.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import np.com.lims.common.audit.BaseEntity;
import np.com.lims.common.tenant.TenantContext;
import org.hibernate.annotations.Filter;

/**
 * One organization's own WhatsApp Business Cloud API credentials (phone number id + access
 * token), overriding this deployment's shared application.yml config for that org only — same
 * pattern as {@code SmsCredentials} / {@code IrdCredentials} / {@code PaymentCredentials}.
 */
@Entity
@Table(name = "whatsapp_credentials")
@Filter(name = "tenantFilter", condition = "organization_id = :tenantId")
public class WhatsAppCredentials extends BaseEntity {

    @Column(name = "organization_id", nullable = false, updatable = false)
    private Long organizationId;

    @Column(name = "whatsapp_enabled", nullable = false)
    private boolean whatsAppEnabled;

    @Column(name = "phone_number_id", length = 60)
    private String phoneNumberId;

    @Column(name = "access_token_enc", length = 1000)
    private String accessTokenEncrypted;

    protected WhatsAppCredentials() {
    }

    public static WhatsAppCredentials createFor(Long organizationId) {
        WhatsAppCredentials c = new WhatsAppCredentials();
        c.organizationId = organizationId;
        return c;
    }

    public void update(boolean enabled, String phoneNumberId, String accessTokenEncryptedOrNull) {
        this.whatsAppEnabled = enabled;
        this.phoneNumberId = phoneNumberId;
        if (accessTokenEncryptedOrNull != null) {
            this.accessTokenEncrypted = accessTokenEncryptedOrNull;
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

    public boolean isWhatsAppEnabled() {
        return whatsAppEnabled;
    }

    public String getPhoneNumberId() {
        return phoneNumberId;
    }

    public String getAccessTokenEncrypted() {
        return accessTokenEncrypted;
    }

    public boolean fullyConfigured() {
        return whatsAppEnabled && hasText(phoneNumberId) && hasText(accessTokenEncrypted);
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
