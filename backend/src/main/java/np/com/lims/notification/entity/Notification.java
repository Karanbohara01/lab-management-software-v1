package np.com.lims.notification.entity;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import np.com.lims.common.tenant.TenantContext;
import org.hibernate.annotations.Filter;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

/**
 * Doesn't extend {@code BaseEntity} (no version/updated_at/created_by columns by design), but the
 * {@code tenantFilter} definition itself is global once declared anywhere Hibernate scans (see
 * {@code BaseEntity}) — redeclaring it here with {@code @FilterDef} would fail startup
 * ("Multiple '@FilterDef' annotations define a filter named 'tenantFilter'"), so only
 * {@code @Filter} (which just references the existing definition by name) is needed.
 */
@Entity
@Table(name = "notification")
@Filter(name = "tenantFilter", condition = "organization_id = :tenantId")
public class Notification {

    public enum Type {
        CRITICAL_RESULT, RESULT_BACKLOG, TAT_BREACH, REFLEX_SUGGESTED, IRD_FAILED, LOW_STOCK, EXPIRING_STOCK, EXPIRED_STOCK,
        APPOINTMENT_CANCELLED, SYSTEM
    }

    public enum Severity { INFO, WARNING, CRITICAL }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "organization_id", nullable = false, updatable = false)
    private Long organizationId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 48)
    private Type type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private Severity severity;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 1000)
    private String message;

    @Column(name = "link_path", length = 200)
    private String linkPath;

    /** When set, only users holding this permission see the notification. Null = all recipients. */
    @Column(name = "target_permission", length = 64)
    private String targetPermission;

    /** Stable key used to avoid publishing duplicates for the same underlying condition. */
    @Column(length = 160)
    private String reference;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "notification_read_by", joinColumns = @JoinColumn(name = "notification_id"))
    @Column(name = "username", length = 100)
    private Set<String> readBy = new HashSet<>();

    protected Notification() {
    }

    public Notification(Type type, Severity severity, String title, String message, String linkPath,
                        String targetPermission, String reference) {
        this.type = type;
        this.severity = severity;
        this.title = title;
        this.message = message;
        this.linkPath = linkPath;
        this.targetPermission = targetPermission;
        this.reference = reference;
        this.createdAt = Instant.now();
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

    public void markReadBy(String username) {
        readBy.add(username);
    }

    public boolean isReadBy(String username) {
        return readBy.contains(username);
    }

    public boolean visibleTo(Set<String> permissions) {
        return targetPermission == null || permissions.contains(targetPermission);
    }

    public Long getId() {
        return id;
    }

    public Type getType() {
        return type;
    }

    public Severity getSeverity() {
        return severity;
    }

    public String getTitle() {
        return title;
    }

    public String getMessage() {
        return message;
    }

    public String getLinkPath() {
        return linkPath;
    }

    public String getTargetPermission() {
        return targetPermission;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
