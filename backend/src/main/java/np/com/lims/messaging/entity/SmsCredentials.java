package np.com.lims.messaging.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import np.com.lims.common.audit.BaseEntity;
import np.com.lims.common.tenant.TenantContext;
import org.hibernate.annotations.Filter;

/**
 * One organization's own SMS provider accounts — Sparrow SMS (the original integration) and now
 * Samaya SMS side by side on the same row, overriding this deployment's shared application.yml
 * config for that org only — same pattern as {@code np.com.lims.payment.entity.PaymentCredentials}
 * (esewa_, khalti_ and fonepay_ prefixed columns on one row) / {@code IrdCredentials}.
 *
 * <p>The {@code sms_*} columns (now implicitly Sparrow-specific) are untouched from the original
 * integration; {@code samaya_*} were added alongside them by migration V75, never replacing them,
 * so {@link np.com.lims.messaging.gateway.SparrowSmsGateway} and every existing caller keep
 * working exactly as before. See {@code np.com.lims.communication.gateway.SmsGatewayRegistry} for
 * how a caller picks which provider is actually in effect for an organization.
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

    @Column(name = "samaya_enabled", nullable = false)
    private boolean samayaEnabled;

    @Column(name = "samaya_base_url", length = 255)
    private String samayaBaseUrl;

    @Column(name = "samaya_api_key_enc", length = 500)
    private String samayaApiKeyEncrypted;

    @Column(name = "samaya_sender_id", length = 40)
    private String samayaSenderId;

    /** Null = low-balance alerts disabled — see {@code SmsBalanceSweep}'s javadoc for the "opt-in, never alerts off an unconfirmed number" policy. */
    @Column(name = "low_balance_threshold")
    private Integer lowBalanceThreshold;

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

    public void updateLowBalanceThreshold(Integer threshold) {
        this.lowBalanceThreshold = threshold;
    }

    public void updateSamaya(boolean enabled, String baseUrl, String senderId, String apiKeyEncryptedOrNull) {
        this.samayaEnabled = enabled;
        this.samayaBaseUrl = baseUrl;
        this.samayaSenderId = senderId;
        if (apiKeyEncryptedOrNull != null) {
            this.samayaApiKeyEncrypted = apiKeyEncryptedOrNull;
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

    public boolean isSamayaEnabled() {
        return samayaEnabled;
    }

    public String getSamayaBaseUrl() {
        return samayaBaseUrl;
    }

    public String getSamayaApiKeyEncrypted() {
        return samayaApiKeyEncrypted;
    }

    public String getSamayaSenderId() {
        return samayaSenderId;
    }

    public Integer getLowBalanceThreshold() {
        return lowBalanceThreshold;
    }

    public boolean fullyConfigured() {
        return smsEnabled && hasText(smsFrom) && hasText(smsTokenEncrypted);
    }

    public boolean samayaFullyConfigured() {
        return samayaEnabled && hasText(samayaBaseUrl) && hasText(samayaSenderId) && hasText(samayaApiKeyEncrypted);
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
