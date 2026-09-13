package np.com.lims.ird.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import np.com.lims.common.audit.BaseEntity;
import np.com.lims.common.tenant.TenantContext;
import org.hibernate.annotations.Filter;

/**
 * One organization's own IRD/CBMS taxpayer credentials, overriding this deployment's shared
 * application.yml config for that org only — same pattern as
 * {@code np.com.lims.payment.entity.PaymentCredentials}. {@code irdPasswordEncrypted} holds
 * ciphertext (see {@code np.com.lims.common.crypto.CryptoService}); encryption/decryption happens
 * explicitly in the service layer, not via a JPA converter.
 */
@Entity
@Table(name = "ird_credentials")
@Filter(name = "tenantFilter", condition = "organization_id = :tenantId")
public class IrdCredentials extends BaseEntity {

    @Column(name = "organization_id", nullable = false, updatable = false)
    private Long organizationId;

    @Column(name = "ird_enabled", nullable = false)
    private boolean irdEnabled;

    @Column(name = "ird_username", length = 120)
    private String irdUsername;

    @Column(name = "ird_password_enc", length = 500)
    private String irdPasswordEncrypted;

    @Column(name = "ird_seller_pan", length = 40)
    private String irdSellerPan;

    protected IrdCredentials() {
    }

    public static IrdCredentials createFor(Long organizationId) {
        IrdCredentials c = new IrdCredentials();
        c.organizationId = organizationId;
        return c;
    }

    public void update(boolean enabled, String username, String sellerPan, String passwordEncryptedOrNull) {
        this.irdEnabled = enabled;
        this.irdUsername = username;
        this.irdSellerPan = sellerPan;
        if (passwordEncryptedOrNull != null) {
            this.irdPasswordEncrypted = passwordEncryptedOrNull;
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

    public boolean isIrdEnabled() {
        return irdEnabled;
    }

    public String getIrdUsername() {
        return irdUsername;
    }

    public String getIrdPasswordEncrypted() {
        return irdPasswordEncrypted;
    }

    public String getIrdSellerPan() {
        return irdSellerPan;
    }

    public boolean fullyConfigured() {
        return irdEnabled && hasText(irdUsername) && hasText(irdPasswordEncrypted) && hasText(irdSellerPan);
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
