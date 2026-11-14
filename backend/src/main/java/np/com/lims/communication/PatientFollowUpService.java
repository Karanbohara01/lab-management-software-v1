package np.com.lims.communication;

import np.com.lims.common.audit.AuditService;
import np.com.lims.common.exception.ApiException;
import np.com.lims.communication.dto.CommunicationDtos.FollowUpRequest;
import np.com.lims.communication.dto.CommunicationDtos.FollowUpResponse;
import np.com.lims.communication.entity.PatientFollowUp;
import np.com.lims.patient.PatientRepository;
import np.com.lims.patient.entity.Patient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** Minimal CRUD for "come back by this date" reminders — set from the Patient detail page or report release. */
@Service
public class PatientFollowUpService {

    private static final String MODULE = "COMMUNICATION";

    private final PatientFollowUpRepository repository;
    private final PatientRepository patientRepository;
    private final AuditService auditService;

    public PatientFollowUpService(PatientFollowUpRepository repository, PatientRepository patientRepository,
                                  AuditService auditService) {
        this.repository = repository;
        this.patientRepository = patientRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<FollowUpResponse> listForPatient(Long patientId) {
        Patient patient = patientRepository.findById(patientId).orElseThrow(() -> ApiException.notFound("Patient", patientId));
        return repository.findByPatientIdOrderByDueDateDesc(patientId).stream()
                .map(f -> toResponse(f, patient.getFullName())).toList();
    }

    @Transactional
    public FollowUpResponse create(FollowUpRequest request) {
        Patient patient = patientRepository.findById(request.patientId())
                .orElseThrow(() -> ApiException.notFound("Patient", request.patientId()));
        PatientFollowUp followUp = PatientFollowUp.schedule(patient.getId(), request.dueDate(), request.reason());
        followUp = repository.save(followUp);
        auditService.record(MODULE, "CREATE_FOLLOW_UP", "PatientFollowUp", followUp.getId(),
                "Scheduled a follow-up for " + patient.getFullName() + " due " + request.dueDate(), null, null);
        return toResponse(followUp, patient.getFullName());
    }

    @Transactional
    public void markDone(Long id) {
        PatientFollowUp followUp = load(id);
        followUp.markDone();
        auditService.record(MODULE, "COMPLETE_FOLLOW_UP", "PatientFollowUp", id, "Marked follow-up done", null, null);
    }

    @Transactional
    public void cancel(Long id) {
        PatientFollowUp followUp = load(id);
        followUp.cancel();
        auditService.record(MODULE, "CANCEL_FOLLOW_UP", "PatientFollowUp", id, "Cancelled follow-up", null, null);
    }

    private PatientFollowUp load(Long id) {
        return repository.findById(id).orElseThrow(() -> ApiException.notFound("PatientFollowUp", id));
    }

    private static FollowUpResponse toResponse(PatientFollowUp f, String patientName) {
        return new FollowUpResponse(f.getId(), f.getPatientId(), patientName, f.getDueDate(), f.getReason(),
                f.getStatus(), f.getReminderSentAt(), f.getCreatedAt());
    }
}
