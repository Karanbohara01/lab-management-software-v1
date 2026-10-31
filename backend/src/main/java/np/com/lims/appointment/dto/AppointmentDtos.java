package np.com.lims.appointment.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import np.com.lims.appointment.entity.Appointment;
import np.com.lims.appointment.entity.AppointmentStatus;
import np.com.lims.appointment.entity.AppointmentTest;
import np.com.lims.patient.PatientPrivacy;

import java.time.Instant;
import java.util.List;

public final class AppointmentDtos {

    private AppointmentDtos() {
    }

    // ----- requests -----------------------------------------------------

    public record ItemRequest(
            @NotNull Long testId,
            @Min(1) int quantity
    ) {
    }

    public record SaveRequest(
            @NotNull Long patientId,
            Long referringDoctorId,
            Long branchId,
            @NotNull Instant scheduledAt,
            @Size(max = 500) String reason,
            /** Optional — a bare time slot with no tests chosen yet is still a valid booking. */
            @Valid List<ItemRequest> items
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

    /**
     * Deliberately carries no price. Code/name/department are resolved server-side because a
     * DOCTOR-role login holds APPOINTMENT_READ but not TEST_CATALOG_READ, so the client can't
     * look them up itself; the estimate is always computed live via the order preview instead.
     */
    public record TestLine(
            Long testId,
            String testCode,
            String testName,
            String departmentName,
            int quantity
    ) {
        static TestLine from(AppointmentTest i) {
            return new TestLine(i.getTest().getId(), i.getTest().getCode(), i.getTest().getName(),
                    i.getTest().getDepartment().getName(), i.getQuantity());
        }
    }

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
            Instant scheduledAt,
            int testCount
    ) {
        public static ListItem from(Appointment a) {
            return new ListItem(a.getId(), a.getAppointmentNumber(), a.getPatient().getId(),
                    PatientPrivacy.displayName(a.getPatient()), a.getPatient().getMrn(),
                    a.getBranch() == null ? null : a.getBranch().getId(),
                    a.getBranch() == null ? null : a.getBranch().getName(),
                    a.getReferringDoctor() == null ? null : a.getReferringDoctor().getId(),
                    a.getReferringDoctor() == null ? null : a.getReferringDoctor().getFullName(),
                    a.getStatus(), a.getScheduledAt(), a.getItems().size());
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
            String convertedOrderNumber,
            List<TestLine> items
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
                    a.getConvertedOrder() == null ? null : a.getConvertedOrder().getOrderNumber(),
                    a.getItems().stream().map(TestLine::from).toList());
        }
    }
}
