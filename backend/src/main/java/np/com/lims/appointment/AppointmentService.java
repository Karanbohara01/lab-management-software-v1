package np.com.lims.appointment;

import np.com.lims.appointment.dto.AppointmentDtos.Detail;
import np.com.lims.appointment.dto.AppointmentDtos.ListItem;
import np.com.lims.appointment.dto.AppointmentDtos.SaveRequest;
import np.com.lims.appointment.entity.Appointment;
import np.com.lims.appointment.entity.AppointmentStatus;
import np.com.lims.branch.BranchRepository;
import np.com.lims.branch.entity.Branch;
import np.com.lims.common.audit.AuditService;
import np.com.lims.common.exception.ApiException;
import np.com.lims.common.exception.ErrorCode;
import np.com.lims.common.sequence.SequenceService;
import np.com.lims.common.tenant.TenantGuard;
import np.com.lims.common.web.CurrentUser;
import np.com.lims.doctor.DoctorRepository;
import np.com.lims.doctor.entity.Doctor;
import np.com.lims.notification.NotificationService;
import np.com.lims.notification.entity.Notification;
import np.com.lims.order.LabOrderRepository;
import np.com.lims.order.entity.LabOrder;
import np.com.lims.patient.PatientRepository;
import np.com.lims.patient.entity.Patient;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.List;

@Service
public class AppointmentService {

    private static final String MODULE = "APPOINTMENT";
    private static final String APPOINTMENT_SEQUENCE = "APPOINTMENT_NUMBER";

    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final BranchRepository branchRepository;
    private final LabOrderRepository labOrderRepository;
    private final SequenceService sequenceService;
    private final AuditService auditService;
    private final NotificationService notificationService;

    public AppointmentService(AppointmentRepository appointmentRepository,
                              PatientRepository patientRepository,
                              DoctorRepository doctorRepository,
                              BranchRepository branchRepository,
                              LabOrderRepository labOrderRepository,
                              SequenceService sequenceService,
                              AuditService auditService,
                              NotificationService notificationService) {
        this.appointmentRepository = appointmentRepository;
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
        this.branchRepository = branchRepository;
        this.labOrderRepository = labOrderRepository;
        this.sequenceService = sequenceService;
        this.auditService = auditService;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public Page<ListItem> search(Long patientId, AppointmentStatus status, Long branchId, Instant scheduledFrom,
                                 Instant scheduledTo, String query, Pageable pageable) {
        String normalized = StringUtils.hasText(query) ? query.trim() : null;
        Long effectiveBranchId = CurrentUser.branchId() != null ? CurrentUser.branchId() : branchId;
        Long doctorId = CurrentUser.doctorId();
        return appointmentRepository.search(patientId, status, effectiveBranchId, doctorId, scheduledFrom,
                scheduledTo, normalized, pageable).map(ListItem::from);
    }

    @Transactional(readOnly = true)
    public List<ListItem> forPatient(Long patientId) {
        return appointmentRepository.findByPatientIdOrderByScheduledAtDesc(patientId)
                .stream().map(ListItem::from).toList();
    }

    @Transactional(readOnly = true)
    public Detail get(Long id) {
        return Detail.from(guardDoctorScope(load(id)));
    }

    @Transactional
    public Detail create(SaveRequest request) {
        Patient patient = patientRepository.findWithDoctorById(request.patientId())
                .orElseThrow(() -> ApiException.notFound("Patient", request.patientId()));
        if (!patient.isActive()) {
            throw ApiException.conflict("Patient " + patient.getMrn() + " is inactive");
        }
        Doctor doctor = resolveDoctor(request.referringDoctorId(), patient);
        Branch branch = resolveBranch(request.branchId());

        String number = sequenceService.nextFormatted(APPOINTMENT_SEQUENCE, "APT", 6);
        Appointment appointment = Appointment.open(number, patient, doctor, branch, request.scheduledAt(),
                trimToNull(request.reason()));

        Appointment saved = appointmentRepository.save(appointment);
        auditService.record(MODULE, "CREATE", "Appointment", saved.getId(),
                "Booked appointment " + number + " for " + patient.getFullName(), null, Detail.from(saved));
        return Detail.from(saved);
    }

    @Transactional
    public Detail update(Long id, SaveRequest request) {
        Appointment appointment = load(id);
        Detail before = Detail.from(appointment);

        Doctor doctor = resolveDoctor(request.referringDoctorId(), appointment.getPatient());
        Branch branch = resolveBranch(request.branchId());
        appointment.reschedule(doctor, branch, request.scheduledAt(), trimToNull(request.reason()));

        auditService.record(MODULE, "UPDATE", "Appointment", id,
                "Rescheduled appointment " + appointment.getAppointmentNumber(), before, Detail.from(appointment));
        return Detail.from(appointment);
    }

    @Transactional
    public Detail checkIn(Long id) {
        Appointment appointment = load(id);
        appointment.checkIn();
        auditService.record(MODULE, "CHECK_IN", "Appointment", id,
                "Checked in " + appointment.getAppointmentNumber(), null, Detail.from(appointment));
        return Detail.from(appointment);
    }

    @Transactional
    public Detail cancel(Long id, String reason) {
        Appointment appointment = load(id);
        appointment.cancel(trimToNull(reason));
        auditService.record(MODULE, "CANCEL", "Appointment", id,
                "Cancelled appointment " + appointment.getAppointmentNumber()
                        + (reason == null ? "" : " – " + reason.trim()), null, Detail.from(appointment));
        notificationService.publish(Notification.Type.APPOINTMENT_CANCELLED, Notification.Severity.INFO,
                "Appointment cancelled",
                appointment.getAppointmentNumber() + " for " + appointment.getPatient().getFullName() + " was cancelled",
                "/appointments/" + id, "APPOINTMENT_READ", "appointment:" + id);
        return Detail.from(appointment);
    }

    @Transactional
    public Detail markNoShow(Long id) {
        Appointment appointment = load(id);
        appointment.markNoShow();
        auditService.record(MODULE, "NO_SHOW", "Appointment", id,
                "Marked " + appointment.getAppointmentNumber() + " as no-show", null, Detail.from(appointment));
        return Detail.from(appointment);
    }

    /**
     * Thin status-only mutation — the real order is built through the existing, already-proven
     * order-creation flow (OrderBuilderPage, LabOrderService), never here. This keeps the two
     * modules fully decoupled: an appointment just records which order it turned into.
     */
    @Transactional
    public Detail markConverted(Long id, Long orderId) {
        Appointment appointment = load(id);
        LabOrder order = TenantGuard.owned(labOrderRepository.findById(orderId), LabOrder::getOrganizationId)
                .orElseThrow(() -> ApiException.notFound("Order", orderId));
        appointment.convert(order);
        auditService.record(MODULE, "CONVERT", "Appointment", id,
                "Converted " + appointment.getAppointmentNumber() + " to order " + order.getOrderNumber(),
                null, Detail.from(appointment));
        return Detail.from(appointment);
    }

    // ----- helpers ----------------------------------------------------

    private Doctor resolveDoctor(Long doctorId, Patient patient) {
        if (doctorId == null) {
            return patient.getReferringDoctor();
        }
        return TenantGuard.owned(doctorRepository.findById(doctorId), Doctor::getOrganizationId)
                .orElseThrow(() -> ApiException.notFound("Doctor", doctorId));
    }

    /**
     * Explicit request branch wins; otherwise the acting user's home branch; otherwise (HQ user,
     * no branch chosen) the first active branch — same fallback chain as LabOrderService.
     */
    private Branch resolveBranch(Long requestedBranchId) {
        if (requestedBranchId != null) {
            return TenantGuard.owned(branchRepository.findById(requestedBranchId), Branch::getOrganizationId)
                    .orElseThrow(() -> ApiException.notFound("Branch", requestedBranchId));
        }
        if (CurrentUser.branchId() != null) {
            return TenantGuard.owned(branchRepository.findById(CurrentUser.branchId()), Branch::getOrganizationId)
                    .orElseThrow(() -> ApiException.notFound("Branch", CurrentUser.branchId()));
        }
        return branchRepository.findFirstByActiveTrueOrderByIdAsc()
                .orElseThrow(() -> new ApiException(ErrorCode.INTERNAL_ERROR, "No active branch is configured"));
    }

    private Appointment load(Long id) {
        return appointmentRepository.findDetailedById(id)
                .orElseThrow(() -> ApiException.notFound("Appointment", id));
    }

    /**
     * A DOCTOR-role login must never fetch an appointment by id outside their own referrals,
     * mirroring LabOrderService.guardDoctorScope — reported as 404, not 403.
     */
    private Appointment guardDoctorScope(Appointment appointment) {
        Long doctorId = CurrentUser.doctorId();
        if (doctorId != null
                && (appointment.getReferringDoctor() == null
                        || !doctorId.equals(appointment.getReferringDoctor().getId()))) {
            throw ApiException.notFound("Appointment", appointment.getId());
        }
        return appointment;
    }

    private static String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
