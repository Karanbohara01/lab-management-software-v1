package np.com.lims.patient;

import np.com.lims.common.audit.AuditService;
import np.com.lims.common.exception.ApiException;
import np.com.lims.common.exception.ErrorCode;
import np.com.lims.common.tenant.TenantContext;
import np.com.lims.common.web.CurrentUser;
import np.com.lims.patient.dto.PatientDocumentDtos.Summary;
import np.com.lims.patient.dto.PatientDocumentDtos.UploadRequest;
import np.com.lims.patient.entity.Patient;
import np.com.lims.patient.entity.PatientDocument;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
public class PatientDocumentService {

    private static final String MODULE = "PATIENT_DOCUMENT";
    private static final long MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

    private final PatientDocumentRepository documentRepository;
    private final PatientRepository patientRepository;
    private final AuditService auditService;

    public PatientDocumentService(PatientDocumentRepository documentRepository,
                                  PatientRepository patientRepository,
                                  AuditService auditService) {
        this.documentRepository = documentRepository;
        this.patientRepository = patientRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<Summary> list(Long patientId) {
        requirePatient(patientId);
        return documentRepository.findAllByPatient(TenantContext.require(), patientId)
                .stream()
                .map(Summary::from)
                .toList();
    }

    @Transactional
    public Summary upload(Long patientId, UploadRequest request, MultipartFile file) {
        Patient patient = requirePatient(patientId);

        if (file == null || file.isEmpty()) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "File is required");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "File size exceeds 25 MB limit");
        }

        String originalName = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "document");
        String contentType = file.getContentType() != null ? file.getContentType() : "application/octet-stream";

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw new ApiException(ErrorCode.INTERNAL_ERROR, "Failed to read uploaded file contents");
        }

        String uploader = CurrentUser.username();
        PatientDocument doc = PatientDocument.create(
                patient,
                request.title().trim(),
                request.documentType(),
                request.documentDate(),
                request.doctorOrFacility() != null ? request.doctorOrFacility().trim() : null,
                request.notes() != null ? request.notes().trim() : null,
                originalName,
                contentType,
                file.getSize(),
                bytes,
                uploader
        );

        PatientDocument saved = documentRepository.save(doc);
        auditService.record(MODULE, "UPLOAD", "PatientDocument", saved.getId(),
                "Uploaded " + saved.getDocumentType() + " document '" + saved.getTitle() + "' for patient " + patient.getMrn(),
                null, Summary.from(saved));

        return Summary.from(saved);
    }

    @Transactional(readOnly = true)
    public PatientDocument get(Long patientId, Long documentId) {
        requirePatient(patientId);
        return documentRepository.findByIdAndPatient(TenantContext.require(), patientId, documentId)
                .orElseThrow(() -> ApiException.notFound("PatientDocument", documentId));
    }

    @Transactional
    public void delete(Long patientId, Long documentId) {
        requirePatient(patientId);
        PatientDocument doc = documentRepository.findByIdAndPatient(TenantContext.require(), patientId, documentId)
                .orElseThrow(() -> ApiException.notFound("PatientDocument", documentId));

        doc.softDelete(CurrentUser.username());
        documentRepository.save(doc);

        auditService.record(MODULE, "DELETE", "PatientDocument", documentId,
                "Archived document '" + doc.getTitle() + "' for patient " + doc.getPatient().getMrn(),
                Summary.from(doc), null);
    }

    private Patient requirePatient(Long patientId) {
        return patientRepository.findById(patientId)
                .orElseThrow(() -> ApiException.notFound("Patient", patientId));
    }
}
