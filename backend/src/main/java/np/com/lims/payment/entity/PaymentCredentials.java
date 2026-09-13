package np.com.lims.payment.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import np.com.lims.common.audit.BaseEntity;
import np.com.lims.common.tenant.TenantContext;
import org.hibernate.annotations.Filter;

/**
 * One organization's own eSewa/Khalti credentials, overriding this deployment's shared
 * application.yml config for that org only. Secret fields hold ciphertext (see
 * {@code np.com.lims.common.crypto.CryptoService}) — encryption/decryption happens explicitly in
 * the service layer, not via a JPA converter (deliberately: a JPA {@code AttributeConverter}
 * needs Spring-bean wiring into entity lifecycle callbacks, the same class of fragility already
 * hit and avoided with {@code TenantContext} — plain columns + an explicit service-layer step are
 * simpler and just as safe).
 */
@Entity
@Table(name = "payment_credentials")
@Filter(name = "tenantFilter", condition = "organization_id = :tenantId")
public class PaymentCredentials extends BaseEntity {

    @Column(name = "organization_id", nullable = false, updatable = false)
    private Long organizationId;

    @Column(name = "esewa_enabled", nullable = false)
    private boolean esewaEnabled;

    @Column(name = "esewa_merchant_code", length = 120)
    private String esewaMerchantCode;

    @Column(name = "esewa_secret_key_enc", length = 500)
    private String esewaSecretKeyEncrypted;

    @Column(name = "khalti_enabled", nullable = false)
    private boolean khaltiEnabled;

    @Column(name = "khalti_secret_key_enc", length = 500)
    private String khaltiSecretKeyEncrypted;

    protected PaymentCredentials() {
    }

    public static PaymentCredentials createFor(Long organizationId) {
        PaymentCredentials c = new PaymentCredentials();
        c.organizationId = organizationId;
        return c;
    }

    public void updateEsewa(boolean enabled, String merchantCode, String secretKeyEncryptedOrNull) {
        this.esewaEnabled = enabled;
        this.esewaMerchantCode = merchantCode;
        if (secretKeyEncryptedOrNull != null) {
            this.esewaSecretKeyEncrypted = secretKeyEncryptedOrNull;
        }
    }

    public void updateKhalti(boolean enabled, String secretKeyEncryptedOrNull) {
        this.khaltiEnabled = enabled;
        if (secretKeyEncryptedOrNull != null) {
            this.khaltiSecretKeyEncrypted = secretKeyEncryptedOrNull;
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

    public boolean isEsewaEnabled() {
        return esewaEnabled;
    }

    public String getEsewaMerchantCode() {
        return esewaMerchantCode;
    }

    public String getEsewaSecretKeyEncrypted() {
        return esewaSecretKeyEncrypted;
    }

    public boolean isKhaltiEnabled() {
        return khaltiEnabled;
    }

    public String getKhaltiSecretKeyEncrypted() {
        return khaltiSecretKeyEncrypted;
    }

    public boolean esewaFullyConfigured() {
        return esewaEnabled && hasText(esewaMerchantCode) && hasText(esewaSecretKeyEncrypted);
    }

    public boolean khaltiFullyConfigured() {
        return khaltiEnabled && hasText(khaltiSecretKeyEncrypted);
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
