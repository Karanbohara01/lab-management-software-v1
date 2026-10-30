package np.com.lims.appointment.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import np.com.lims.appointment.entity.Appointment;
import np.com.lims.appointment.entity.AppointmentStatus;
import np.com.lims.patient.PatientPrivacy;

import java.time.Instant;

public final class AppointmentDtos {

    private AppointmentDtos() {
    }

    // ----- requests -----------------------------------------------------

    public record SaveRequest(
            @NotNull Long patientId,
            Long referringDoctorId,
            Long branchId,
            @NotNull Instant scheduledAt,
            @Size(max = 500) String reason
    ) {
    }

    public record CancelRequest(
            @Size(max = 500) String reason
    ) {
    }

    public record ConvertRequest(
            @NotNull Long orderId
    ) {
    }

    // ----- responses --------------------------------------------------

    public record ListItem(
            Long id,
            String appointmentNumber,
            Long patientId,
            String patientName,
            String patientMrn,
            Long branchId,
            String branchName,
            Long referringDoctorId,
            String referringDoctorName,
            AppointmentStatus status,
            Instant scheduledAt
    ) {
        public static ListItem from(Appointment a) {
            return new ListItem(a.getId(), a.getAppointmentNumber(), a.getPatient().getId(),
                    PatientPrivacy.displayName(a.getPatient()), a.getPatient().getMrn(),
                    a.getBranch() == null ? null : a.getBranch().getId(),
                    a.getBranch() == null ? null : a.getBranch().getName(),
                    a.getReferringDoctor() == null ? null : a.getReferringDoctor().getId(),
                    a.getReferringDoctor() == null ? null : a.getReferringDoctor().getFullName(),
                    a.getStatus(), a.getScheduledAt());
        }
    }

    public record Detail(
            Long id,
            String appointmentNumber,
            Long patientId,
            String patientName,
            String patientMrn,
            Long branchId,
            String branchName,
            Long referringDoctorId,
            String referringDoctorName,
            AppointmentStatus status,
            Instant scheduledAt,
            String reason,
            Instant checkedInAt,
            Instant cancelledAt,
            String cancelReason,
            Instant convertedAt,
            Long convertedOrderId,
            String convertedOrderNumber
    ) {
        public static Detail from(Appointment a) {
            return new Detail(
                    a.getId(), a.getAppointmentNumber(), a.getPatient().getId(),
                    PatientPrivacy.displayName(a.getPatient()), a.getPatient().getMrn(),
                    a.getBranch() == null ? null : a.getBranch().getId(),
                    a.getBranch() == null ? null : a.getBranch().getName(),
                    a.getReferringDoctor() == null ? null : a.getReferringDoctor().getId(),
                    a.getReferringDoctor() == null ? null : a.getReferringDoctor().getFullName(),
                    a.getStatus(), a.getScheduledAt(), a.getReason(),
                    a.getCheckedInAt(), a.getCancelledAt(), a.getCancelReason(),
                    a.getConvertedAt(),
                    a.getConvertedOrder() == null ? null : a.getConvertedOrder().getId(),
                    a.getConvertedOrder() == null ? null : a.getConvertedOrder().getOrderNumber());
        }
    }
}
