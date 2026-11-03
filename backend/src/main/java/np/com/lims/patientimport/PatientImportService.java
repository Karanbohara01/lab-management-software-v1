package np.com.lims.patientimport;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import np.com.lims.common.api.PageResponse;
import np.com.lims.common.audit.AuditService;
import np.com.lims.common.exception.ApiException;
import np.com.lims.common.exception.ErrorCode;
import np.com.lims.common.tenant.TenantContext;
import np.com.lims.common.web.CurrentUser;
import np.com.lims.patientimport.dto.ImportDtos.ColumnSuggestion;
import np.com.lims.patientimport.dto.ImportDtos.ConfirmImportRequest;
import np.com.lims.patientimport.dto.ImportDtos.FieldDefinition;
import np.com.lims.patientimport.dto.ImportDtos.ImportOptions;
import np.com.lims.patientimport.dto.ImportDtos.JobDetail;
import np.com.lims.patientimport.dto.ImportDtos.JobSummary;
import np.com.lims.patientimport.dto.ImportDtos.MappingRequest;
import np.com.lims.patientimport.dto.ImportDtos.RowView;
import np.com.lims.patientimport.dto.ImportDtos.UploadResult;
import np.com.lims.patientimport.entity.DuplicatePolicy;
import np.com.lims.patientimport.entity.ImportJobStatus;
import np.com.lims.patientimport.entity.ImportRowStatus;
import np.com.lims.patientimport.entity.PatientImportJob;
import np.com.lims.patientimport.entity.PatientImportRow;
import np.com.lims.patientimport.read.TabularReader;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.TreeMap;

/**
 * What the administrator's requests do. The long work happens on the background worker; everything
 * here is short enough to sit inside an HTTP request.
 *
 * <p>Tenancy comes from the authenticated request in every method, never from anything the upload
 * contains: a spreadsheet column called "organization id" is just a column, and is ignored.
 */
@Service
public class PatientImportService {

    private static final String MODULE = "PATIENT_IMPORT";
    /** How many rows of the file are read back for the mapping preview. */
    private static final int PREVIEW_ROWS = 10;

    private final PatientImportJobRepository jobRepository;
    private final PatientImportRowRepository rowRepository;
    private final PatientImportEngine engine;
    private final ImportFileStore fileStore;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;

    public PatientImportService(PatientImportJobRepository jobRepository,
                                PatientImportRowRepository rowRepository,
                                PatientImportEngine engine,
                                ImportFileStore fileStore,
                                AuditService auditService,
                                ObjectMapper objectMapper) {
        this.jobRepository = jobRepository;
        this.rowRepository = rowRepository;
        this.engine = engine;
        this.fileStore = fileStore;
        this.auditService = auditService;
        this.objectMapper = objectMapper;
    }

    /** The fields a spreadsheet can fill, for the template and the mapping screen. */
    public List<FieldDefinition> fields() {
        return java.util.Arrays.stream(ImportField.values())
                .map(f -> new FieldDefinition(f.name(), f.label(), f.mandatory(), f.instruction(), f.example()))
                .toList();
    }

    // ----- step one: upload --------------------------------------------------------------

    /**
     * Stores the file and reads just its header, so the administrator can be shown the columns it
     * found and what each one looks like it means. Nothing is validated or imported yet.
     */
    @Transactional
    public UploadResult upload(MultipartFile file) {
        Long orgId = TenantContext.require();
        requireNoRunningImport(orgId);

        ImportFileStore.Format format = ImportFileStore.formatOf(file.getOriginalFilename());
        ImportFileStore.Stored stored = fileStore.store(orgId, file, format);

        PatientImportJob job = PatientImportJob.forUpload(
                safeFilename(file.getOriginalFilename()), stored.storedFilename(), format.name(),
                stored.sizeBytes(), stored.checksum(), null, 1);
        PatientImportJob saved = jobRepository.save(job);

        List<String> headers;
        List<List<String>> sample = new ArrayList<>();
        try (TabularReader reader = fileStore.open(orgId, stored.storedFilename(), format)) {
            headers = reader.next();
            if (headers == null || headers.isEmpty()) {
                throw new ApiException(ErrorCode.VALIDATION_FAILED,
                        "This file is empty. The first row should name the columns.");
            }
            List<String> row;
            while (sample.size() < PREVIEW_ROWS && (row = reader.next()) != null) {
                if (row.stream().anyMatch(c -> c != null && !c.isBlank())) {
                    sample.add(List.copyOf(row));
                }
            }
        } catch (ApiException e) {
            fileStore.delete(orgId, stored.storedFilename());
            throw e;
        } catch (Exception e) {
            fileStore.delete(orgId, stored.storedFilename());
            throw new ApiException(ErrorCode.VALIDATION_FAILED,
                    "This file could not be read. Check that it is a valid Excel workbook or CSV file.");
        }

        List<ColumnSuggestion> suggestions = suggest(headers, sample);
        List<JobSummary> sameFile = jobRepository
                .findSameFile(orgId, stored.checksum(), saved.getId(), PageRequest.of(0, 1))
                .stream().map(JobSummary::from).toList();

        auditService.record(MODULE, "UPLOAD", "PatientImportJob", saved.getId(),
                truncate("Uploaded " + saved.getOriginalFilename() + " for patient import ("
                        + headers.size() + " columns)"), null, null);

        return new UploadResult(JobSummary.from(saved), headers, suggestions, sample,
                sameFile.isEmpty() ? null : sameFile.get(0));
    }

    /**
     * What each column looks like it means. A suggestion is only made where the header clearly
     * matches a known field, and no field is ever suggested twice — a spreadsheet with both "Name"
     * and "Patient Name" gets one of them mapped and the other left for the administrator, rather
     * than silently feeding one field from two columns.
     */
    private List<ColumnSuggestion> suggest(List<String> headers, List<List<String>> sample) {
        List<ColumnSuggestion> out = new ArrayList<>();
        java.util.Set<ImportField> taken = new java.util.HashSet<>();
        for (int i = 0; i < headers.size(); i++) {
            String header = headers.get(i);
            Optional<ImportField> match = ImportField.suggestFor(header);
            ImportField field = match.filter(f -> !taken.contains(f)).orElse(null);
            if (field != null) {
                taken.add(field);
            }
            final int index = i;
            List<String> examples = sample.stream()
                    .map(r -> index < r.size() ? r.get(index) : null)
                    .filter(v -> v != null && !v.isBlank())
                    .limit(3)
                    .toList();
            out.add(new ColumnSuggestion(i, header, field == null ? null : field.name(), examples));
        }
        return out;
    }

    // ----- step two: confirm the mapping, which starts the analysis -----------------------

    @Transactional
    public JobDetail confirmMapping(Long jobId, MappingRequest request) {
        PatientImportJob job = owned(jobId);
        Map<Integer, ImportField> mapping = parseMapping(request.mapping());
        validateMapping(mapping);

        job.queueForAnalysis(writeJson(request.mapping()));
        auditService.record(MODULE, "MAPPED", "PatientImportJob", job.getId(),
                truncate("Confirmed column mapping for " + job.getOriginalFilename() + " ("
                        + mapping.size() + " columns mapped)"), null, null);
        return detail(job);
    }

    /** Turns the request's column-to-field names into the mapping the engine uses, rejecting nonsense. */
    static Map<Integer, ImportField> parseMapping(Map<String, String> raw) {
        Map<Integer, ImportField> mapping = new TreeMap<>();
        if (raw == null || raw.isEmpty()) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "No columns have been mapped.");
        }
        for (Map.Entry<String, String> entry : raw.entrySet()) {
            if (entry.getValue() == null || entry.getValue().isBlank()) {
                continue;
            }
            int index;
            try {
                index = Integer.parseInt(entry.getKey());
            } catch (NumberFormatException e) {
                throw new ApiException(ErrorCode.VALIDATION_FAILED, "Unrecognised column reference: " + entry.getKey());
            }
            ImportField field;
            try {
                field = ImportField.valueOf(entry.getValue());
            } catch (IllegalArgumentException e) {
                throw new ApiException(ErrorCode.VALIDATION_FAILED, "Unknown patient field: " + entry.getValue());
            }
            mapping.put(index, field);
        }
        return mapping;
    }

    /** Every mandatory field mapped, and no field fed by two columns. */
    static void validateMapping(Map<Integer, ImportField> mapping) {
        Map<ImportField, Integer> seen = new LinkedHashMap<>();
        for (Map.Entry<Integer, ImportField> entry : mapping.entrySet()) {
            Integer previous = seen.putIfAbsent(entry.getValue(), entry.getKey());
            if (previous != null) {
                throw new ApiException(ErrorCode.VALIDATION_FAILED,
                        entry.getValue().label() + " is mapped to two different columns. Each patient field can "
                                + "take its value from only one column.");
            }
        }
        List<String> missing = ImportField.mandatoryFields().stream()
                .filter(f -> !seen.containsKey(f))
                .map(ImportField::label)
                .toList();
        if (!missing.isEmpty()) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED,
                    "These required fields have no column: " + String.join(", ", missing) + ".");
        }
        if (!seen.containsKey(ImportField.DATE_OF_BIRTH) && !seen.containsKey(ImportField.AGE_YEARS)) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED,
                    "Map either Date of Birth or Age — a patient record needs one of the two.");
        }
    }

    // ----- step three: confirm the import -------------------------------------------------

    @Transactional
    public JobDetail confirmImport(Long jobId, ConfirmImportRequest request) {
        PatientImportJob job = owned(jobId);
        requireNoRunningImport(job.getOrganizationId());
        ImportOptions options = new ImportOptions(request.duplicatePolicy(), request.weakMatchPolicy()).withDefaults();

        job.queueForImport(writeJson(options));
        auditService.record(MODULE, "START", "PatientImportJob", job.getId(),
                truncate("Started importing " + job.getOriginalFilename() + ": " + job.getValidRows()
                        + " valid rows, matches set to " + options.duplicatePolicy().name()
                        + ", possible matches set to " + options.weakMatchPolicy().name()), null, null);
        return detail(job);
    }

    @Transactional
    public JobDetail cancel(Long jobId) {
        PatientImportJob job = owned(jobId);
        job.requestCancel();
        auditService.record(MODULE, "CANCEL", "PatientImportJob", job.getId(),
                truncate("Cancelled the import of " + job.getOriginalFilename()), null, null);
        return detail(job);
    }

    /**
     * Starts a fresh import from a corrected file, recorded as a retry of the original.
     *
     * <p>The new job is a new file with its own staged rows; nothing from the old one is reused.
     * That is what makes a retry safe — the patients the first attempt created are already in the
     * database, and the duplicate pass of the second attempt will find them.
     */
    @Transactional
    public UploadResult retry(Long originalJobId, MultipartFile file) {
        PatientImportJob original = owned(originalJobId);
        UploadResult result = upload(file);
        PatientImportJob fresh = jobRepository.findById(result.job().id()).orElseThrow();
        fresh.setRetryOfJobId(original.getId());
        auditService.record(MODULE, "RETRY", "PatientImportJob", fresh.getId(),
                truncate("Retrying import " + original.getId() + " (" + original.getOriginalFilename()
                        + ") with a corrected file"), null, null);
        return new UploadResult(JobSummary.from(fresh), result.headers(), result.columns(), result.sampleRows(),
                result.sameFileAs());
    }

    // ----- reading ------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public JobDetail get(Long jobId) {
        return detail(owned(jobId));
    }

    @Transactional(readOnly = true)
    public PageResponse<JobSummary> history(int page, int size) {
        Page<PatientImportJob> jobs = jobRepository.history(TenantContext.require(),
                PageRequest.of(Math.max(0, page), Math.min(Math.max(size, 1), 100)));
        return PageResponse.from(jobs.map(JobSummary::from));
    }

    /** A page of the job's staged rows, optionally narrowed to one outcome. */
    @Transactional(readOnly = true)
    public PageResponse<RowView> rows(Long jobId, List<ImportRowStatus> statuses, int page, int size) {
        PatientImportJob job = owned(jobId);
        PageRequest pageable = PageRequest.of(Math.max(0, page), Math.min(Math.max(size, 1), 100));
        Page<PatientImportRow> rows = statuses == null || statuses.isEmpty()
                ? rowRepository.findAllRows(job.getId(), pageable)
                : rowRepository.findPage(job.getId(), statuses, pageable);
        return PageResponse.from(rows.map(r -> RowView.from(r, readJson(r.getRawData()))));
    }

    // ----- helpers ------------------------------------------------------------------------

    private JobDetail detail(PatientImportJob job) {
        return JobDetail.from(job, engine.countsByStatus(job.getId()), readMapping(job), readOptions(job));
    }

    /** The confirmation-time choices, or null for a job not yet confirmed. */
    public ImportOptions readOptions(PatientImportJob job) {
        if (job.getOptions() == null) {
            return null;
        }
        try {
            return objectMapper.readValue(job.getOptions(), ImportOptions.class).withDefaults();
        } catch (Exception e) {
            return ImportOptions.defaults();
        }
    }

    private Map<String, String> readMapping(PatientImportJob job) {
        if (job.getColumnMapping() == null) {
            return Map.of();
        }
        try {
            return objectMapper.readValue(job.getColumnMapping(), new TypeReference<LinkedHashMap<String, String>>() {
            });
        } catch (Exception e) {
            return Map.of();
        }
    }

    /** The job, but only if it belongs to the clinic making the request. */
    private PatientImportJob owned(Long jobId) {
        return jobRepository.findOwned(jobId, TenantContext.require())
                .orElseThrow(() -> ApiException.notFound("Import", jobId));
    }

    /**
     * One import at a time per clinic. Two running together could each decide a row is new, having
     * both looked before either inserted.
     */
    private void requireNoRunningImport(Long orgId) {
        long running = jobRepository.countByStatus(orgId,
                List.of(ImportJobStatus.ANALYSING, ImportJobStatus.IMPORTING));
        if (running > 0) {
            throw new ApiException(ErrorCode.RESOURCE_CONFLICT,
                    "An import is already running for this clinic. Wait for it to finish, or cancel it, before "
                            + "starting another.");
        }
    }

    /** Keeps the clinic's filename for display but strips any path a browser may have included. */
    private static String safeFilename(String original) {
        if (original == null || original.isBlank()) {
            return "upload";
        }
        String base = original.replace('\\', '/');
        base = base.substring(base.lastIndexOf('/') + 1);
        return base.length() <= 255 ? base : base.substring(0, 255);
    }

    /** The audit log's summary column is 500 characters and the service does not truncate for us. */
    static String truncate(String summary) {
        return summary.length() <= 500 ? summary : summary.substring(0, 497) + "...";
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            return "{}";
        }
    }

    private Map<String, String> readJson(String json) {
        if (json == null) {
            return Map.of();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<LinkedHashMap<String, String>>() {
            });
        } catch (Exception e) {
            return Map.of();
        }
    }
}
