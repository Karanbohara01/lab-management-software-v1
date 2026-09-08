package np.com.lims.common.audit;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

/** Append-only record of a sensitive operation. Rows are never updated or deleted by the application. */
@Entity
@Table(name = "audit_log")
@EntityListeners(AuditingEntityListener.class)
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String actor;

    @Column(nullable = false, length = 64)
    private String action;

    @Column(nullable = false, length = 64)
    private String module;

    @Column(name = "entity_type", length = 96)
    private String entityType;

    @Column(name = "entity_id", length = 64)
    private String entityId;

    @Column(length = 500)
    private String summary;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "before_state")
    private String beforeState;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "after_state")
    private String afterState;

    @Column(name = "ip_address", length = 64)
    private String ipAddress;

    @Column(name = "user_agent", length = 255)
    private String userAgent;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected AuditLog() {
    }

    AuditLog(String actor, String action, String module, String entityType, String entityId,
             String summary, String beforeState, String afterState, String ipAddress, String userAgent) {
        this.actor = actor;
        this.action = action;
        this.module = module;
        this.entityType = entityType;
        this.entityId = entityId;
        this.summary = summary;
        this.beforeState = beforeState;
        this.afterState = afterState;
        this.ipAddress = ipAddress;
        this.userAgent = userAgent;
    }

    public Long getId() {
        return id;
    }

    public String getActor() {
        return actor;
    }

    public String getAction() {
        return action;
    }

    public String getModule() {
        return module;
    }

    public String getEntityType() {
        return entityType;
    }

    public String getEntityId() {
        return entityId;
    }

    public String getSummary() {
        return summary;
    }

    public String getBeforeState() {
        return beforeState;
    }

    public String getAfterState() {
        return afterState;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
