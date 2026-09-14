package np.com.lims.auth.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import np.com.lims.common.audit.BaseEntity;
import np.com.lims.user.entity.User;
import org.hibernate.annotations.Filter;

import java.time.Instant;

/**
 * One password-reset request. {@code organizationId} is set explicitly to the target user's own
 * org rather than via the usual {@code TenantContext}-stamping {@code @PrePersist} — this row is
 * created from an UNAUTHENTICATED request (no JWT, no resolved tenant), the same situation
 * {@code User.createForOrganization} exists for.
 */
@Entity
@Table(name = "password_reset_token")
@Filter(name = "tenantFilter", condition = "organization_id = :tenantId")
public class PasswordResetToken extends BaseEntity {

    @Column(name = "organization_id", nullable = false, updatable = false)
    private Long organizationId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, updatable = false)
    private User user;

    @Column(name = "token_hash", nullable = false, updatable = false, length = 64)
    private String tokenHash;

    @Column(name = "expires_at", nullable = false, updatable = false)
    private Instant expiresAt;

    @Column(name = "used_at")
    private Instant usedAt;

    protected PasswordResetToken() {
    }

    public static PasswordResetToken issueFor(User user, String tokenHash, Instant expiresAt) {
        PasswordResetToken t = new PasswordResetToken();
        t.organizationId = user.getOrganizationId();
        t.user = user;
        t.tokenHash = tokenHash;
        t.expiresAt = expiresAt;
        return t;
    }

    /** False once used, or past {@code expiresAt}. */
    public boolean isUsable(Instant now) {
        return usedAt == null && expiresAt.isAfter(now);
    }

    public void markUsed(Instant when) {
        this.usedAt = when;
    }

    public Long getOrganizationId() {
        return organizationId;
    }

    public User getUser() {
        return user;
    }

    public String getTokenHash() {
        return tokenHash;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public Instant getUsedAt() {
        return usedAt;
    }
}
