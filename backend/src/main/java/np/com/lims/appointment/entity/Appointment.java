package np.com.lims.appointment.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import np.com.lims.branch.entity.Branch;
import np.com.lims.common.audit.BaseEntity;
import np.com.lims.common.exception.ApiException;
import np.com.lims.common.tenant.TenantContext;
import np.com.lims.doctor.entity.Doctor;
import np.com.lims.order.entity.LabOrder;
import np.com.lims.patient.entity.Patient;
import org.hibernate.annotations.Filter;

import java.time.Instant;

@Entity
@Table(name = "appointment")
@Filter(name = "tenantFilter", condition = "organization_id = :tenantId")
public class Appointment extends BaseEntity {

    @Column(name = "organization_id", nullable = false, updatable = false)
    private Long organizationId;

    @Column(name = "appointment_number", nullable = false, length = 24, updatable = false)
    private String appointmentNumber;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "referring_doctor_id")
    private Doctor referringDoctor;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "branch_id")
    private Branch branch;

    @Column(name = "scheduled_at", nullable = false)
    private Instant scheduledAt;

    @Column(length = 500)
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private AppointmentStatus status = AppointmentStatus.SCHEDULED;

    @Column(name = "checked_in_at")
    private Instant checkedInAt;

    @Column(name = "cancelled_at")
    private Instant cancelledAt;

    @Column(name = "cancel_reason", length = 500)
    private String cancelReason;

    @Column(name = "converted_at")
    private Instant convertedAt;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "converted_order_id")
    private LabOrder convertedOrder;

    protected Appointment() {
    }

    public static Appointment open(String appointmentNumber, Patient patient, Doctor referringDoctor, Branch branch,
                                   Instant scheduledAt, String reason) {
        Appointment appointment = new Appointment();
        appointment.appointmentNumber = appointmentNumber;
        appointment.patient = patient;
        appointment.referringDoctor = referringDoctor;
        appointment.branch = branch;
        appointment.scheduledAt = scheduledAt;
        appointment.reason = reason;
        appointment.status = AppointmentStatus.SCHEDULED;
        return appointment;
    }

    public void assertEditable() {
        if (!status.isEditable()) {
            throw ApiException.invalidTransition(
                    "Appointment " + appointmentNumber + " is " + status + " and can no longer be rescheduled");
        }
    }

    public void reschedule(Doctor referringDoctor, Branch branch, Instant scheduledAt, String reason) {
        assertEditable();
        this.referringDoctor = referringDoctor;
        this.branch = branch;
        this.scheduledAt = scheduledAt;
        this.reason = reason;
    }

    public void checkIn() {
        transitionTo(AppointmentStatus.CHECKED_IN);
        this.checkedInAt = Instant.now();
    }

    public void cancel(String reason) {
        transitionTo(AppointmentStatus.CANCELLED);
        this.cancelledAt = Instant.now();
        this.cancelReason = reason;
    }

    public void markNoShow() {
        transitionTo(AppointmentStatus.NO_SHOW);
    }

    public void convert(LabOrder order) {
        transitionTo(AppointmentStatus.CONVERTED);
        this.convertedOrder = order;
        this.convertedAt = Instant.now();
    }

    private void transitionTo(AppointmentStatus target) {
        if (!status.canTransitionTo(target)) {
            throw ApiException.invalidTransition(
                    "Appointment " + appointmentNumber + " cannot move from " + status + " to " + target);
        }
        this.status = target;
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

    public String getAppointmentNumber() {
        return appointmentNumber;
    }

    public Patient getPatient() {
        return patient;
    }

    public Doctor getReferringDoctor() {
        return referringDoctor;
    }

    public Branch getBranch() {
        return branch;
    }

    public Instant getScheduledAt() {
        return scheduledAt;
    }

    public String getReason() {
        return reason;
    }

    public AppointmentStatus getStatus() {
        return status;
    }

    public Instant getCheckedInAt() {
        return checkedInAt;
    }

    public Instant getCancelledAt() {
        return cancelledAt;
    }

    public String getCancelReason() {
        return cancelReason;
    }

    public Instant getConvertedAt() {
        return convertedAt;
    }

    public LabOrder getConvertedOrder() {
        return convertedOrder;
    }
}
