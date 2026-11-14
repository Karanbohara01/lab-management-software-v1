package np.com.lims.communication.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import np.com.lims.common.audit.BaseEntity;
import np.com.lims.common.tenant.TenantContext;
import org.hibernate.annotations.Filter;

import java.time.Instant;
import java.time.LocalDate;

/**
 * "Come back for a follow-up by this date" — nothing like this existed anywhere in the schema
 * before this feature (confirmed by a codebase-wide search). Its own small table rather than a
 * column on {@code Patient}/{@code Report}: a patient can have more than one outstanding
 * follow-up, and it has its own lifecycle independent of any single visit.
 */
@Entity
@Table(name = "patient_follow_up")
@Filter(name = "tenantFilter", condition = "organization_id = :tenantId")
public class PatientFollowUp extends BaseEntity {

    @Column(name = "organization_id", nullable = false, updatable = false)
    private Long organizationId;

    @Column(name = "patient_id", nullable = false, updatable = false)
    private Long patientId;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "reason", length = 255)
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 16)
    private FollowUpStatus status = FollowUpStatus.PENDING;

    /** Idempotency for the follow-up-due sweep — a reminder fires at most once. */
    @Column(name = "reminder_sent_at")
    private Instant reminderSentAt;

    protected PatientFollowUp() {
    }

    public static PatientFollowUp schedule(Long patientId, LocalDate dueDate, String reason) {
        PatientFollowUp f = new PatientFollowUp();
        f.patientId = patientId;
        f.dueDate = dueDate;
        f.reason = reason;
        f.status = FollowUpStatus.PENDING;
        return f;
    }

    public void markDone() {
        this.status = FollowUpStatus.DONE;
    }

    public void cancel() {
        this.status = FollowUpStatus.CANCELLED;
    }

    public void markReminderSent() {
        this.reminderSentAt = Instant.now();
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

    public Long getPatientId() {
        return patientId;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public String getReason() {
        return reason;
    }

    public FollowUpStatus getStatus() {
        return status;
    }

    public Instant getReminderSentAt() {
        return reminderSentAt;
    }
}
