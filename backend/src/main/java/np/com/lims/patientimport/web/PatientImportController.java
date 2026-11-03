package np.com.lims.patientimport.web;

import jakarta.validation.Valid;
import np.com.lims.common.api.PageResponse;
import np.com.lims.patientimport.ImportCsvWriter;
import np.com.lims.patientimport.PatientImportService;
import np.com.lims.patientimport.dto.ImportDtos.ConfirmImportRequest;
import np.com.lims.patientimport.dto.ImportDtos.FieldDefinition;
import np.com.lims.patientimport.dto.ImportDtos.JobDetail;
import np.com.lims.patientimport.dto.ImportDtos.JobSummary;
import np.com.lims.patientimport.dto.ImportDtos.MappingRequest;
import np.com.lims.patientimport.dto.ImportDtos.RowView;
import np.com.lims.patientimport.dto.ImportDtos.UploadResult;
import np.com.lims.patientimport.entity.ImportRowStatus;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * The bulk patient import.
 *
 * <p>Every endpoint requires {@code PATIENT_IMPORT}, which is held by administrators only — loading
 * a clinic's whole patient list is a different act from registering one patient at the desk, and is
 * gated separately from {@code PATIENT_WRITE}.
 *
 * <p>The clinic an import belongs to always comes from the authenticated user. Nothing in an
 * uploaded file can name an organization, and every lookup here is by job id and tenant together.
 */
@RestController
@RequestMapping("/patient-imports")
public class PatientImportController {

    private final PatientImportService service;

    public PatientImportController(PatientImportService service) {
        this.service = service;
    }

    /** The patient fields a column can be mapped to, for the mapping screen. */
    @GetMapping("/fields")
    @PreAuthorize("hasAuthority('PERM_PATIENT_IMPORT')")
    public List<FieldDefinition> fields() {
        return service.fields();
    }

    /** The blank template, with instructions and examples in the file itself. */
    @GetMapping(value = "/template", produces = "text/csv")
    @PreAuthorize("hasAuthority('PERM_PATIENT_IMPORT')")
    public ResponseEntity<byte[]> template() {
        return download("patient-import-template.csv", ImportCsvWriter.template());
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('PERM_PATIENT_IMPORT')")
    public UploadResult upload(@RequestPart("file") MultipartFile file) {
        return service.upload(file);
    }

    /** Uploads a corrected file as a retry of an earlier import. */
    @PostMapping(value = "/{id}/retry", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('PERM_PATIENT_IMPORT')")
    public UploadResult retry(@PathVariable Long id, @RequestPart("file") MultipartFile file) {
        return service.retry(id, file);
    }

    /** Confirms which column feeds which field, which starts the checking pass. */
    @PostMapping("/{id}/mapping")
    @PreAuthorize("hasAuthority('PERM_PATIENT_IMPORT')")
    public JobDetail confirmMapping(@PathVariable Long id, @Valid @RequestBody MappingRequest request) {
        return service.confirmMapping(id, request);
    }

    /** Confirms the import itself, after the administrator has seen what the checking pass found. */
    @PostMapping("/{id}/start")
    @PreAuthorize("hasAuthority('PERM_PATIENT_IMPORT')")
    public JobDetail start(@PathVariable Long id, @RequestBody(required = false) ConfirmImportRequest request) {
        return service.confirmImport(id, request == null ? new ConfirmImportRequest(null) : request);
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAuthority('PERM_PATIENT_IMPORT')")
    public JobDetail cancel(@PathVariable Long id) {
        return service.cancel(id);
    }

    /** The job as it stands. This is what the progress screen polls. */
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_PATIENT_IMPORT')")
    public JobDetail get(@PathVariable Long id) {
        return service.get(id);
    }

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_PATIENT_IMPORT')")
    public PageResponse<JobSummary> history(@RequestParam(defaultValue = "0") int page,
                                            @RequestParam(defaultValue = "20") int size) {
        return service.history(page, size);
    }

    /** A page of the job's rows, optionally narrowed to one outcome. */
    @GetMapping("/{id}/rows")
    @PreAuthorize("hasAuthority('PERM_PATIENT_IMPORT')")
    public PageResponse<RowView> rows(@PathVariable Long id,
                                      @RequestParam(required = false) List<ImportRowStatus> status,
                                      @RequestParam(defaultValue = "0") int page,
                                      @RequestParam(defaultValue = "25") int size) {
        return service.rows(id, status, page, size);
    }

    /**
     * A report of one kind of outcome, as CSV. Capped at the same limit the invoice export uses:
     * beyond that the file is more than a spreadsheet will comfortably open, and the administrator
     * is better served narrowing it.
     */
    @GetMapping(value = "/{id}/report", produces = "text/csv")
    @PreAuthorize("hasAuthority('PERM_PATIENT_IMPORT')")
    public ResponseEntity<byte[]> report(@PathVariable Long id,
                                         @RequestParam(required = false) List<ImportRowStatus> status) {
        List<ImportRowStatus> wanted = status == null || status.isEmpty()
                ? List.of(ImportRowStatus.INVALID, ImportRowStatus.FAILED)
                : status;
        List<RowView> rows = service.rows(id, wanted, 0, 10_000).content();
        String name = "patient-import-" + id + "-" + wanted.get(0).name().toLowerCase() + ".csv";
        boolean explain = wanted.stream().anyMatch(s -> s != ImportRowStatus.IMPORTED);
        return download(name, ImportCsvWriter.report(rows, explain));
    }

    private static ResponseEntity<byte[]> download(String filename, String body) {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .header(HttpHeaders.CONTENT_TYPE, "text/csv; charset=UTF-8")
                .body(bytes);
    }
}
