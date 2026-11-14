package np.com.lims.communication;

import np.com.lims.common.api.PageResponse;
import np.com.lims.common.audit.AuditService;
import np.com.lims.common.exception.ApiException;
import np.com.lims.common.exception.ErrorCode;
import np.com.lims.communication.dto.CommunicationDtos.OptOutRequest;
import np.com.lims.communication.dto.CommunicationDtos.OptOutResponse;
import np.com.lims.communication.entity.SmsOptOut;
import np.com.lims.patient.PatientRepository;
import np.com.lims.patient.entity.Patient;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * The do-not-contact list management surface — see {@link SmsOptOut}'s own javadoc for why it's
 * keyed by phone number rather than patient. Enforcement itself lives in
 * {@code SmsMessageService#send}; this class is just CRUD over the list staff uses to maintain it.
 */
@Service
public class SmsOptOutService {

    private static final String MODULE = "COMMUNICATION";

    private final SmsOptOutRepository repository;
    private final PatientRepository patientRepository;
    private final AuditService auditService;

    public SmsOptOutService(SmsOptOutRepository repository, PatientRepository patientRepository, AuditService auditService) {
        this.repository = repository;
        this.patientRepository = patientRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public PageResponse<OptOutResponse> list(Pageable pageable) {
        return PageResponse.from(repository.findAllByOrderByCreatedAtDesc(pageable).map(this::toResponse));
    }

    @Transactional
    public OptOutResponse optOut(OptOutRequest request) {
        if (!NepaliPhoneValidator.isValidMobile(request.phone())) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED,
                    "\"" + request.phone() + "\" does not look like a Nepali mobile number.");
        }
        String phone = NepaliPhoneValidator.normalize(request.phone());
        if (repository.existsByPhone(phone)) {
            throw new ApiException(ErrorCode.RESOURCE_CONFLICT, "This number is already on the do-not-contact list.");
        }
        SmsOptOut optOut = repository.save(SmsOptOut.of(phone, request.patientId(), request.reason(), request.note()));
        auditService.record(MODULE, "OPT_OUT", "SmsOptOut", optOut.getId(),
                "Added " + phone + " to the SMS do-not-contact list"
                        + (request.reason() != null && !request.reason().isBlank() ? " (" + request.reason() + ")" : ""),
                null, null);
        return toResponse(optOut);
    }

    @Transactional
    public void remove(Long id) {
        SmsOptOut optOut = repository.findById(id).orElseThrow(() -> ApiException.notFound("SmsOptOut", id));
        String phone = optOut.getPhone();
        repository.delete(optOut);
        auditService.record(MODULE, "REMOVE_OPT_OUT", "SmsOptOut", id,
                "Removed " + phone + " from the SMS do-not-contact list — it can be messaged again", null, null);
    }

    private OptOutResponse toResponse(SmsOptOut o) {
        String patientName = o.getPatientId() == null ? null
                : patientRepository.findById(o.getPatientId()).map(Patient::getFullName).orElse(null);
        return new OptOutResponse(o.getId(), o.getPhone(), o.getPatientId(), patientName, o.getReason(), o.getNote(),
                o.getCreatedAt(), o.getCreatedBy());
    }
}
