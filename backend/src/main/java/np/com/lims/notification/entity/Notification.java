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
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "notification")
public class Notification {

    public enum Type {
        CRITICAL_RESULT, RESULT_BACKLOG, IRD_FAILED, LOW_STOCK, EXPIRING_STOCK, EXPIRED_STOCK, SYSTEM
    }

    public enum Severity { INFO, WARNING, CRITICAL }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

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
