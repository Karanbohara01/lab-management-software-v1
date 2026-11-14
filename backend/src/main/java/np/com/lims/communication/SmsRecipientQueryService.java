package np.com.lims.communication;

import np.com.lims.appointment.AppointmentRepository;
import np.com.lims.appointment.entity.AppointmentStatus;
import np.com.lims.common.exception.ApiException;
import np.com.lims.common.exception.ErrorCode;
import np.com.lims.communication.entity.SmsRecipientFilterType;
import np.com.lims.patient.PatientRepository;
import np.com.lims.patient.entity.Patient;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Turns one of the 9 recipient-selection methods the campaign composer offers into a
 * deduplicated, phone-validated list ready to stage as {@code SmsCampaignRecipient} rows.
 * Deduplication and validation (Nepali mobile format — see {@link NepaliPhoneValidator}) happen
 * here, once, regardless of which filter produced the raw list, so every campaign's recipient
 * count already reflects what will actually be attempted.
 */
@Service
public class SmsRecipientQueryService {

    /** A safety cap, not a silent truncation: {@link ResolvedList#capped()} tells the caller if this was hit. */
    private static final int MAX_RECIPIENTS = 20_000;

    private final PatientRepository patientRepository;
    private final AppointmentRepository appointmentRepository;
    private final SmsOptOutRepository optOutRepository;

    public SmsRecipientQueryService(PatientRepository patientRepository, AppointmentRepository appointmentRepository,
                                    SmsOptOutRepository optOutRepository) {
        this.patientRepository = patientRepository;
        this.appointmentRepository = appointmentRepository;
        this.optOutRepository = optOutRepository;
    }

    public record ResolvedRecipient(Long patientId, String phone, String name) {
    }

    public record RawRecipient(String phone, String name) {
    }

    public record Filter(SmsRecipientFilterType type, Instant from, Instant to, Integer notVisitedDays,
                         String departmentName, List<Long> patientIds, List<RawRecipient> rawRecipients) {
    }

    public record ResolvedList(List<ResolvedRecipient> recipients, int invalidPhoneCount, int optedOutCount, boolean capped) {
    }

    @Transactional(readOnly = true)
    public ResolvedList resolve(Filter filter) {
        List<ResolvedRecipient> raw = switch (filter.type()) {
            case ALL_PATIENTS -> fromPatients(patientRepository.findRecipientsAll(cap()));
            case REGISTERED_IN_RANGE -> fromPatients(patientRepository.findRecipientsRegisteredBetween(
                    requireFrom(filter), requireTo(filter), cap()));
            case VISITED_IN_RANGE -> fromPatients(patientRepository.findRecipientsVisitedBetween(
                    requireFrom(filter), requireTo(filter), cap()));
            case UPCOMING_APPOINTMENTS -> fromPatients(appointmentRepository.findRecipientsWithUpcomingAppointment(
                    List.of(AppointmentStatus.SCHEDULED, AppointmentStatus.CHECKED_IN), Instant.now(),
                    filter.to() != null ? filter.to() : Instant.now().plus(30, ChronoUnit.DAYS), cap()));
            case NOT_VISITED_IN_DAYS -> fromPatients(patientRepository.findRecipientsNotVisitedSince(
                    Instant.now().minus(requireDays(filter), ChronoUnit.DAYS), cap()));
            case DEPARTMENT_OR_CATEGORY -> fromPatients(patientRepository.findRecipientsByDepartment(
                    requireDepartment(filter), filter.from(), filter.to(), cap()));
            case MANUAL_SELECTION -> fromPatients(patientRepository.findByIdInAndActiveTrueAndMergedIntoIdIsNull(
                    requireIds(filter)));
            case FILE_IMPORT, CUSTOM_PHONE_LIST -> fromRaw(requireRaw(filter));
        };
        return dedupeAndValidate(raw);
    }

    private static List<ResolvedRecipient> fromPatients(List<Patient> patients) {
        return patients.stream().map(p -> new ResolvedRecipient(p.getId(), p.getPhone(), p.getFullName())).toList();
    }

    private static List<ResolvedRecipient> fromRaw(List<RawRecipient> raw) {
        return raw.stream().map(r -> new ResolvedRecipient(null, r.phone(), r.name())).toList();
    }

    private ResolvedList dedupeAndValidate(List<ResolvedRecipient> in) {
        Map<String, ResolvedRecipient> byPhone = new LinkedHashMap<>();
        int invalid = 0;
        int optedOut = 0;
        for (ResolvedRecipient r : in) {
            if (!NepaliPhoneValidator.isValidMobile(r.phone())) {
                invalid++;
                continue;
            }
            String normalized = NepaliPhoneValidator.normalize(r.phone());
            if (optOutRepository.existsByPhone(normalized)) {
                optedOut++;
                continue;
            }
            byPhone.putIfAbsent(normalized, new ResolvedRecipient(r.patientId(), normalized, r.name()));
        }
        boolean capped = in.size() >= MAX_RECIPIENTS;
        return new ResolvedList(List.copyOf(byPhone.values()), invalid, optedOut, capped);
    }

    private static Pageable cap() {
        return PageRequest.of(0, MAX_RECIPIENTS);
    }

    private static Instant requireFrom(Filter f) {
        if (f.from() == null) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "A start date is required for this recipient filter.");
        }
        return f.from();
    }

    private static Instant requireTo(Filter f) {
        if (f.to() == null) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "An end date is required for this recipient filter.");
        }
        return f.to();
    }

    private static int requireDays(Filter f) {
        if (f.notVisitedDays() == null || f.notVisitedDays() < 1) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "A positive number of days is required for this recipient filter.");
        }
        return f.notVisitedDays();
    }

    private static String requireDepartment(Filter f) {
        if (f.departmentName() == null || f.departmentName().isBlank()) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "A department is required for this recipient filter.");
        }
        return f.departmentName();
    }

    private static List<Long> requireIds(Filter f) {
        if (f.patientIds() == null || f.patientIds().isEmpty()) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "Select at least one patient.");
        }
        return f.patientIds();
    }

    private static List<RawRecipient> requireRaw(Filter f) {
        if (f.rawRecipients() == null || f.rawRecipients().isEmpty()) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "No recipients were provided.");
        }
        return f.rawRecipients();
    }
}
