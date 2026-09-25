package np.com.lims.catalog.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import np.com.lims.common.audit.BaseEntity;
import np.com.lims.common.tenant.TenantContext;
import org.hibernate.annotations.Filter;

/**
 * "If {@code sourceTestId}'s result comes back {@code trigger}, suggest ordering {@code targetTestId}"
 * — e.g. an abnormal TSH suggesting a reflex Free T4. Deliberately suggestion-only: triggering a
 * rule never auto-adds or bills the target test (see {@code TestResultService}'s reflex check) —
 * a human must explicitly place that order, the same as any other test they decide to add.
 */
@Entity
@Table(name = "reflex_rule")
@Filter(name = "tenantFilter", condition = "organization_id = :tenantId")
public class ReflexRule extends BaseEntity {

    @Column(name = "organization_id", nullable = false, updatable = false)
    private Long organizationId;

    @Column(name = "source_test_id", nullable = false)
    private Long sourceTestId;

    @Enumerated(EnumType.STRING)
    @Column(name = "trigger_type", nullable = false, length = 16)
    private ReflexTrigger trigger;

    @Column(name = "target_test_id", nullable = false)
    private Long targetTestId;

    @Column(length = 500)
    private String note;

    @Column(nullable = false)
    private boolean active = true;

    protected ReflexRule() {
    }

    public static ReflexRule create(Long sourceTestId, ReflexTrigger trigger, Long targetTestId, String note) {
        ReflexRule r = new ReflexRule();
        r.sourceTestId = sourceTestId;
        r.trigger = trigger;
        r.targetTestId = targetTestId;
        r.note = note;
        return r;
    }

    public void update(ReflexTrigger trigger, Long targetTestId, String note) {
        this.trigger = trigger;
        this.targetTestId = targetTestId;
        this.note = note;
    }

    public void setActive(boolean active) {
        this.active = active;
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

    public Long getSourceTestId() {
        return sourceTestId;
    }

    public ReflexTrigger getTrigger() {
        return trigger;
    }

    public Long getTargetTestId() {
        return targetTestId;
    }

    public String getNote() {
        return note;
    }

    public boolean isActive() {
        return active;
    }
}
