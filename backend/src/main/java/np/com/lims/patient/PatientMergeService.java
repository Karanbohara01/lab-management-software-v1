package np.com.lims.patient;

import np.com.lims.common.audit.AuditService;
import np.com.lims.common.exception.ApiException;
import np.com.lims.common.exception.ErrorCode;
import np.com.lims.common.web.CurrentUser;
import np.com.lims.patient.dto.PatientDtos.Detail;
import np.com.lims.patient.dto.PatientDtos.MergeParty;
import np.com.lims.patient.dto.PatientDtos.MergePreview;
import np.com.lims.patient.dto.PatientDtos.MergeRequest;
import np.com.lims.patient.entity.Address;
import np.com.lims.patient.entity.Patient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Service
public class PatientMergeService {

    private static final String MODULE = "PATIENT";

    private final PatientRepository patientRepository;
    private final PatientMergeRepository mergeRepository;
    private final PatientIdentifierRepository identifierRepository;
    private final AuditService auditService;

    public PatientMergeService(PatientRepository patientRepository,
                               PatientMergeRepository mergeRepository,
                               PatientIdentifierRepository identifierRepository,
                               AuditService auditService) {
        this.patientRepository = patientRepository;
        this.mergeRepository = mergeRepository;
        this.identifierRepository = identifierRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public MergePreview preview(Long survivorId, Long duplicateId) {
        Patient survivor = load(survivorId);
        Patient duplicate = load(duplicateId);

        List<String> warnings = new ArrayList<>();
        if (Objects.equals(survivorId, duplicateId)) {
            warnings.add("The same record is selected as both survivor and duplicate.");
        }
        if (survivor.isMerged()) {
            warnings.add("The surviving record has itself already been merged into another.");
        }
        if (duplicate.isMerged()) {
            warnings.add("The selected duplicate has already been merged.");
        }
        if (survivor.getGender() != duplicate.getGender()) {
            warnings.add("Gender differs — " + survivor.getGender() + " vs " + duplicate.getGender() + ".");
        }
        if (bothSet(survivor.getDateOfBirth(), duplicate.getDateOfBirth())
                && !survivor.getDateOfBirth().equals(duplicate.getDateOfBirth())) {
            warnings.add("Date of birth differs between the two records.");
        }
        if (duplicate.isConfidential() && !survivor.isConfidential()) {
            warnings.add("The duplicate is confidential — the surviving record will become confidential.");
        }

        return new MergePreview(
                MergeParty.from(survivor), MergeParty.from(duplicate),
                mergeRepository.countLabOrders(duplicateId),
                mergeRepository.countSamples(duplicateId),
                mergeRepository.countResults(duplicateId),
                mergeRepository.countReports(duplicateId),
                mergeRepository.countInvoices(duplicateId),
                adoptedFields(survivor, duplicate),
                warnings);
    }

    @Transactional
    public Detail merge(Long survivorId, MergeRequest request) {
        if (Objects.equals(survivorId, request.duplicateId())) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "A patient cannot be merged into itself.");
        }
        Patient survivor = load(survivorId);
        Patient duplicate = load(request.duplicateId());
        if (survivor.isMerged()) {
            throw new ApiException(ErrorCode.RESOURCE_CONFLICT,
                    "The surviving record has itself been merged into another and cannot be a merge target.");
        }
        if (duplicate.isMerged()) {
            throw new ApiException(ErrorCode.RESOURCE_CONFLICT, "That record has already been merged.");
        }

        Detail before = Detail.from(survivor);
        List<String> adopted = adoptedFields(survivor, duplicate);
        survivor.adoptMissingFrom(duplicate);

        String actor = CurrentUser.username();
        long dup = duplicate.getId();
        long surv = survivor.getId();
        int orders = mergeRepository.repointLabOrders(dup, surv, actor);
        int samples = mergeRepository.repointSamples(dup, surv, actor);
        int results = mergeRepository.repointResults(dup, surv, actor);
        int reports = mergeRepository.repointReports(dup, surv, actor);
        int invoices = mergeRepository.repointInvoices(dup, surv, actor);

        var movedIds = identifierRepository.findByPatientIdOrderByPrimaryDescIdAsc(dup);
        movedIds.forEach(i -> i.reassignTo(survivor));
        identifierRepository.saveAll(movedIds);

        duplicate.markMergedInto(surv, actor);

        String summary = "Merged " + duplicate.getMrn() + " into " + survivor.getMrn()
                + " — moved " + orders + " orders, " + samples + " samples, " + results + " results, "
                + reports + " reports, " + invoices + " invoices"
                + (adopted.isEmpty() ? "" : "; adopted " + String.join(", ", adopted))
                + ". Reason: " + request.reason().trim();

        auditService.record(MODULE, "MERGE", "Patient", surv, summary, before, Detail.from(survivor));
        auditService.record(MODULE, "MERGED_INTO", "Patient", dup,
                duplicate.getMrn() + " merged into " + survivor.getMrn() + " (" + actor + ")", null, null);

        return Detail.from(survivor);
    }

    // ------------------------------------------------------------------------

    private List<String> adoptedFields(Patient survivor, Patient duplicate) {
        List<String> fields = new ArrayList<>();
        add(fields, "phone", isBlank(survivor.getPhone()) && !isBlank(duplicate.getPhone()));
        add(fields, "alternate phone", isBlank(survivor.getAlternatePhone()) && !isBlank(duplicate.getAlternatePhone()));
        add(fields, "email", isBlank(survivor.getEmail()) && !isBlank(duplicate.getEmail()));
        add(fields, "date of birth", survivor.getDateOfBirth() == null && duplicate.getDateOfBirth() != null);
        add(fields, "blood group", survivor.getBloodGroup() == null && duplicate.getBloodGroup() != null);
        add(fields, "permanent address", isEmpty(survivor.getAddress()) && !isEmpty(duplicate.getAddress()));
        add(fields, "emergency contact",
                (survivor.getEmergencyContact() == null || survivor.getEmergencyContact().isEmpty())
                        && duplicate.getEmergencyContact() != null && !duplicate.getEmergencyContact().isEmpty());
        add(fields, "referring doctor", survivor.getReferringDoctor() == null && duplicate.getReferringDoctor() != null);
        add(fields, "external MRN", isBlank(survivor.getExternalMrn()) && !isBlank(duplicate.getExternalMrn()));
        return fields;
    }

    private static void add(List<String> list, String label, boolean when) {
        if (when) {
            list.add(label);
        }
    }

    private static boolean isEmpty(Address a) {
        return a == null || a.isEmpty();
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    private static boolean bothSet(Object a, Object b) {
        return a != null && b != null;
    }

    private Patient load(Long id) {
        return patientRepository.findById(id).orElseThrow(() -> ApiException.notFound("Patient", id));
    }
}
