package np.com.lims.patient.web;

import jakarta.validation.Valid;
import np.com.lims.patient.PatientDocumentService;
import np.com.lims.patient.dto.PatientDocumentDtos.Summary;
import np.com.lims.patient.dto.PatientDocumentDtos.UploadRequest;
import np.com.lims.patient.entity.PatientDocument;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/patients/{patientId}/documents")
public class PatientDocumentController {

    private final PatientDocumentService service;

    public PatientDocumentController(PatientDocumentService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_PATIENT_READ')")
    public List<Summary> list(@PathVariable Long patientId) {
        return service.list(patientId);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('PERM_PATIENT_WRITE')")
    public Summary upload(
            @PathVariable Long patientId,
            @RequestPart("data") @Valid UploadRequest request,
            @RequestPart("file") MultipartFile file
    ) {
        return service.upload(patientId, request, file);
    }

    @GetMapping("/{documentId}/download")
    @PreAuthorize("hasAuthority('PERM_PATIENT_READ')")
    public ResponseEntity<Resource> download(
            @PathVariable Long patientId,
            @PathVariable Long documentId,
            @RequestParam(name = "inline", defaultValue = "false") boolean inline
    ) {
        PatientDocument doc = service.get(patientId, documentId);
        ByteArrayResource resource = new ByteArrayResource(doc.getFileData());

        String disposition = (inline ? "inline" : "attachment") + "; filename*=UTF-8''"
                + URLEncoder.encode(doc.getFileName(), StandardCharsets.UTF_8).replace("+", "%20");

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition)
                .contentType(MediaType.parseMediaType(doc.getFileType()))
                .contentLength(doc.getFileSizeBytes())
                .body(resource);
    }

    @DeleteMapping("/{documentId}")
    @PreAuthorize("hasAuthority('PERM_PATIENT_WRITE')")
    public ResponseEntity<Void> delete(
            @PathVariable Long patientId,
            @PathVariable Long documentId
    ) {
        service.delete(patientId, documentId);
        return ResponseEntity.noContent().build();
    }
}
