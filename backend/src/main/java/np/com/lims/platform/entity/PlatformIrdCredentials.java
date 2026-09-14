package np.com.lims.platform.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import np.com.lims.common.audit.BaseEntity;

/**
 * This deployment's own shared CBMS taxpayer login — a single row (no organization_id), editable
 * from the platform admin dashboard instead of only via {@code application.yml}/env vars. See
 * {@code CbmsIrdGateway.resolve()} for the full precedence order: a clinic's own {@code
 * IrdCredentials} (if set) wins first, then this row, then the static {@code lims.ird.*} config
 * as the lowest-precedence fallback.
 */
@Entity
@Table(name = "platform_ird_credentials")
public class PlatformIrdCredentials extends BaseEntity {

    @Column(name = "ird_enabled", nullable = false)
    private boolean irdEnabled;

    @Column(name = "ird_username", length = 120)
    private String irdUsername;

    @Column(name = "ird_password_enc", length = 500)
    private String irdPasswordEncrypted;

    @Column(name = "ird_seller_pan", length = 40)
    private String irdSellerPan;

    @Column(name = "ird_seller_name", length = 160)
    private String irdSellerName;

    protected PlatformIrdCredentials() {
    }

    public static PlatformIrdCredentials createEmpty() {
        return new PlatformIrdCredentials();
    }

    public void update(boolean enabled, String username, String sellerPan, String sellerName, String passwordEncryptedOrNull) {
        this.irdEnabled = enabled;
        this.irdUsername = username;
        this.irdSellerPan = sellerPan;
        this.irdSellerName = sellerName;
        if (passwordEncryptedOrNull != null) {
            this.irdPasswordEncrypted = passwordEncryptedOrNull;
        }
    }

    public boolean fullyConfigured() {
        return irdEnabled && hasText(irdUsername) && hasText(irdPasswordEncrypted) && hasText(irdSellerPan);
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
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

    public String getIrdSellerName() {
        return irdSellerName;
    }
}
