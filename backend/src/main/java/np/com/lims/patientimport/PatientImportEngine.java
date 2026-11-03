package np.com.lims.patientimport;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import np.com.lims.common.exception.ApiException;
import np.com.lims.common.exception.ErrorCode;
import np.com.lims.common.tenant.TenantContext;
import np.com.lims.patient.PatientRepository;
import np.com.lims.patient.PatientService;
import np.com.lims.patient.dto.PatientDtos.UpsertRequest;
import np.com.lims.patient.entity.Patient;
import np.com.lims.patientimport.entity.DuplicatePolicy;
import np.com.lims.patientimport.entity.ImportRowStatus;
import np.com.lims.patientimport.entity.PatientImportJob;
import np.com.lims.patientimport.entity.PatientImportRow;
import np.com.lims.patientimport.read.TabularReader;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * The two passes that do the work: read and check the file, then create the patients.
 *
 * <p>Both run on the background worker's thread, outside any HTTP request, which has two
 * consequences handled explicitly here. There is no tenant on the thread, so the caller sets
 * {@link TenantContext} from the job before calling in and every query names the organization
 * itself. And there is no security context, so the user who uploaded the file is carried on the job
 * and passed down rather than read from the thread.
 *
 * <p>Nothing holds the file, the dataset or the row set in memory. The analysis pass streams the
 * file and writes staged rows in batches; duplicate detection is a handful of set-based queries;
 * the import pass walks the staged rows a batch at a time.
 */
@Component
public class PatientImportEngine {

    private static final Logger log = LoggerFactory.getLogger(PatientImportEngine.class);

    /** How many staged rows are written per flush during analysis, and read per duplicate window. */
    private static final int STAGE_BATCH = 500;

    private final PatientImportRowRepository rowRepository;
    private final PatientRepository patientRepository;
    private final PatientService patientService;
    private final ImportFileStore fileStore;
    private final ObjectMapper objectMapper;
    private final int maxRows;

    /**
     * Transaction boundaries are taken explicitly rather than by annotating these methods. The
     * analysis pass drives its own units in a loop, and {@code @Transactional} on a method called
     * through {@code this} is never seen by the proxy that would apply it — the work would run with
     * no transaction at all, which fails silently rather than loudly.
     */
    private final TransactionTemplate transaction;

    public PatientImportEngine(PatientImportRowRepository rowRepository,
                               PatientRepository patientRepository,
                               PatientService patientService,
                               ImportFileStore fileStore,
                               ObjectMapper objectMapper,
                               PlatformTransactionManager transactionManager,
                               @Value("${lims.patient-import.max-rows:500000}") int maxRows) {
        this.rowRepository = rowRepository;
        this.patientRepository = patientRepository;
        this.patientService = patientService;
        this.fileStore = fileStore;
        this.objectMapper = objectMapper;
        this.maxRows = maxRows;
        this.transaction = new TransactionTemplate(transactionManager);
        this.transaction.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    // ----- pass one: read, validate, stage ---------------------------------------------------

    public record AnalysisResult(int total, int valid, int invalid, int duplicate) {
    }

    /**
     * Streams the file, validating each row and staging it. No patient is created and nothing is
     * decided — this pass only establishes what is in the file and what is wrong with it.
     *
     * <p>Rows are written in batches, so the memory cost is one batch whether the file has a
     * thousand rows or half a million.
     */
    public AnalysisResult analyse(PatientImportJob job, Map<Integer, ImportField> mapping) {
        Long orgId = job.getOrganizationId();
        // Re-analysing replaces whatever a previous attempt staged.
        transaction.executeWithoutResult(status -> rowRepository.deleteByJobId(job.getId()));

        int total = 0;
        List<PatientImportRow> pending = new ArrayList<>(STAGE_BATCH);

        try (TabularReader reader = fileStore.open(orgId, job.getStoredFilename(),
                ImportFileStore.Format.valueOf(job.getFileFormat()))) {

            List<String> cells;
            while ((cells = reader.next()) != null) {
                int lineNumber = reader.rowNumber();
                if (lineNumber <= job.getHeaderRow() || isBlankRow(cells)) {
                    continue;
                }
                total++;
                if (total > maxRows) {
                    throw new ApiException(ErrorCode.VALIDATION_FAILED,
                            "This file has more than " + maxRows + " rows, which is more than one import can take. "
                                    + "Split it into smaller files and import them one after another.");
                }

                ImportRowMapper.Mapped mapped = ImportRowMapper.map(cells, mapping);
                PatientImportRow row = new PatientImportRow(orgId, job.getId(), lineNumber, writeJson(mapped.raw()));
                if (mapped.ok()) {
                    row.markValid(mapped.dedupExternalId(), mapped.dedupPhone(), mapped.dedupNameKey(),
                            mapped.dedupDob());
                } else {
                    row.markInvalid(mapped.errorField(), mapped.errorMessage());
                }
                pending.add(row);

                if (pending.size() >= STAGE_BATCH) {
                    saveStaged(pending);
                    pending.clear();
                }
            }
            if (!pending.isEmpty()) {
                saveStaged(pending);
            }
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Reading the uploaded file for import job {} failed", job.getId(), e);
            throw new ApiException(ErrorCode.VALIDATION_FAILED,
                    "The file could not be read all the way through. It may be incomplete or corrupt.");
        }

        if (total == 0) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED,
                    "This file has a header but no patient rows beneath it.");
        }

        int duplicates = detectDuplicates(job);
        Map<ImportRowStatus, Long> counts = countsByStatus(job.getId());
        return new AnalysisResult(
                total,
                counts.getOrDefault(ImportRowStatus.VALID, 0L).intValue(),
                counts.getOrDefault(ImportRowStatus.INVALID, 0L).intValue(),
                duplicates);
    }

    private void saveStaged(List<PatientImportRow> rows) {
        List<PatientImportRow> batch = List.copyOf(rows);
        transaction.executeWithoutResult(status -> {
            rowRepository.saveAll(batch);
            rowRepository.flush();
        });
    }

    private static boolean isBlankRow(List<String> cells) {
        return cells.stream().allMatch(c -> c == null || c.isBlank());
    }

    // ----- duplicate detection ---------------------------------------------------------------

    /**
     * Marks the rows that match something, in the order that matters:
     *
     * <ol>
     *   <li><b>Against the database.</b> A row whose clinic-issued patient ID, phone number, or name
     *       and date of birth already belong to a patient here. One query per key over a whole
     *       window of rows, never a lookup per row.</li>
     *   <li><b>Within the file itself.</b> A row repeating a key an earlier row of the same
     *       spreadsheet used — later copies are flagged, the first stays importable. Three
     *       set-based queries over the staged rows.</li>
     * </ol>
     *
     * @return how many rows were flagged
     */
    private int detectDuplicates(PatientImportJob job) {
        Integer flagged = transaction.execute(status -> againstDatabase(job) + withinFile(job));
        return flagged == null ? 0 : flagged;
    }

    private int againstDatabase(PatientImportJob job) {
        Long orgId = job.getOrganizationId();
        int flagged = 0;
        int afterRow = 0;

        while (true) {
            List<PatientImportRow> window =
                    rowRepository.findValidAfter(job.getId(), afterRow, PageRequest.of(0, STAGE_BATCH));
            if (window.isEmpty()) {
                break;
            }
            // Advance past this window whether or not anything in it was flagged, so the pass
            // always moves forward even as rows stop being VALID underneath it.
            afterRow = window.get(window.size() - 1).getRowNumber();

            Map<String, String> namesByKey = new HashMap<>();
            for (PatientImportRow row : window) {
                String name = rawValue(row, ImportField.FULL_NAME);
                if (name != null && row.getDedupNameKey() != null) {
                    namesByKey.putIfAbsent(row.getDedupNameKey(), name);
                }
            }

            Set<String> externalIds = window.stream().map(PatientImportRow::getDedupExternalId)
                    .filter(Objects::nonNull).collect(Collectors.toSet());
            Set<String> phones = window.stream().map(PatientImportRow::getDedupPhone)
                    .filter(Objects::nonNull).collect(Collectors.toSet());

            Map<String, Patient> byExternalId = externalIds.isEmpty() ? Map.of()
                    : index(patientRepository.findForImportMatchByExternalMrn(orgId, externalIds),
                            p -> p.getExternalMrn() == null ? null
                                    : p.getExternalMrn().toLowerCase(Locale.ROOT));
            Map<String, Patient> byPhone = phones.isEmpty() ? Map.of()
                    : index(patientRepository.findForImportMatchByPhone(orgId, phones), Patient::getPhoneDigits);
            Map<String, Patient> byNameDob = namesByKey.isEmpty() ? Map.of()
                    : index(patientRepository.findForImportMatchByName(orgId, Set.copyOf(namesByKey.values())),
                            p -> nameDobKey(ImportValueParser.nameKey(p.getFullName()), p.getDateOfBirth()));

            for (PatientImportRow row : window) {
                Patient match = null;
                String reason = null;

                if (row.getDedupExternalId() != null) {
                    match = byExternalId.get(row.getDedupExternalId());
                    reason = "Same existing patient ID";
                }
                if (match == null && row.getDedupPhone() != null) {
                    Patient byNumber = byPhone.get(row.getDedupPhone());
                    if (byNumber != null) {
                        match = byNumber;
                        // A shared phone alone is a household; with the same name it is the person.
                        reason = Objects.equals(ImportValueParser.nameKey(byNumber.getFullName()),
                                row.getDedupNameKey())
                                ? "Same phone number and name"
                                : "Same phone number, different name - worth checking";
                    }
                }
                if (match == null && row.getDedupNameKey() != null && row.getDedupDob() != null) {
                    Patient byName = byNameDob.get(nameDobKey(row.getDedupNameKey(), row.getDedupDob()));
                    if (byName != null) {
                        match = byName;
                        reason = "Same name and date of birth";
                    }
                }

                if (match != null) {
                    row.markDuplicateOfPatient(match.getId(), match.getMrn(), reason);
                    flagged++;
                }
            }
            rowRepository.saveAll(window);
            rowRepository.flush();
        }
        return flagged;
    }

    /** One field back out of a staged row, without rebuilding the whole request. */
    private String rawValue(PatientImportRow row, ImportField field) {
        Map<String, String> raw = readJson(row.getRawData());
        return raw == null ? null : raw.get(field.name());
    }

    private static <T> Map<String, T> index(List<T> items, java.util.function.Function<T, String> key) {
        Map<String, T> out = new HashMap<>();
        for (T item : items) {
            String k = key.apply(item);
            if (k != null) {
                // First wins: the oldest matching patient is the one to point at.
                out.putIfAbsent(k, item);
            }
        }
        return out;
    }

    private static String nameDobKey(String nameKey, LocalDate dob) {
        return nameKey == null || dob == null ? null : nameKey + "|" + dob;
    }

    /** Flags rows repeating a key an earlier row of the same file already used. */
    private int withinFile(PatientImportJob job) {
        Map<Long, Integer> repeats = new LinkedHashMap<>();
        Map<Long, String> reasons = new HashMap<>();
        collect(rowRepository.findRepeatedExternalIds(job.getId()), repeats, reasons,
                "Repeats the existing patient ID of row ");
        collect(rowRepository.findRepeatedPhones(job.getId()), repeats, reasons,
                "Repeats the phone number of row ");
        collect(rowRepository.findRepeatedNameAndDob(job.getId()), repeats, reasons,
                "Repeats the name and date of birth of row ");

        if (repeats.isEmpty()) {
            return 0;
        }
        List<PatientImportRow> rows = rowRepository.findAllById(repeats.keySet());
        int flagged = 0;
        for (PatientImportRow row : rows) {
            Integer earlier = repeats.get(row.getId());
            if (earlier != null && row.getStatus() == ImportRowStatus.VALID) {
                row.markDuplicateOfRow(earlier, reasons.get(row.getId()) + earlier);
                flagged++;
            }
        }
        rowRepository.saveAll(rows);
        rowRepository.flush();
        return flagged;
    }

    private static void collect(List<Object[]> found, Map<Long, Integer> into, Map<Long, String> reasons,
                                String reason) {
        for (Object[] pair : found) {
            Long id = ((Number) pair[0]).longValue();
            int earlier = ((Number) pair[1]).intValue();
            if (into.putIfAbsent(id, earlier) == null) {
                reasons.put(id, reason);
            }
        }
    }

    // ----- pass two: create the patients -----------------------------------------------------

    public record BatchResult(int processed, int imported, int updated, int skipped, int failed) {
        public boolean didNothing() {
            return processed == 0;
        }
    }

    /**
     * Creates patients for one batch of staged rows, in one transaction.
     *
     * <p>Each row's outcome is written in the same transaction as the patient it produced, so the
     * two can never disagree: a committed patient always has a staged row naming it, and a rolled
     * back batch leaves both untouched. That is what makes re-running an interrupted import safe —
     * it picks up the rows that have no outcome yet.
     *
     * <p>One transaction per batch, not per import, because the patient-number sequence is a single
     * locked row per clinic: a batch holds it only for its own duration, so registration at the
     * front desk keeps working while a large migration runs.
     *
     * <p>Public and called from the worker, a different bean, so the proxy does apply here.
     */
    @Transactional
    public BatchResult importBatch(PatientImportJob job, DuplicatePolicy policy, String actor, int batchSize) {
        List<ImportRowStatus> todo = policy == DuplicatePolicy.SKIP
                ? List.of(ImportRowStatus.VALID)
                : List.of(ImportRowStatus.VALID, ImportRowStatus.DUPLICATE);

        List<PatientImportRow> batch = rowRepository.findBatch(job.getId(), todo, PageRequest.of(0, batchSize));
        if (batch.isEmpty()) {
            // Nothing importable left. Anything still flagged is settled so no row is left looking
            // unfinished.
            int skipped = rowRepository.markRemaining(job.getId(),
                    List.of(ImportRowStatus.DUPLICATE, ImportRowStatus.DUPLICATE_IN_FILE),
                    policy == DuplicatePolicy.SKIP ? "Skipped: matches an existing patient"
                            : "Skipped: repeats an earlier row of this file");
            return new BatchResult(skipped, 0, 0, skipped, 0);
        }

        int imported = 0;
        int updated = 0;
        int skipped = 0;
        int failed = 0;

        for (PatientImportRow row : batch) {
            try {
                UpsertRequest request = rebuild(row);
                if (request == null) {
                    row.markFailed(null, "This row could no longer be read from its staged copy.");
                    failed++;
                    continue;
                }

                if (row.getStatus() == ImportRowStatus.DUPLICATE) {
                    if (policy == DuplicatePolicy.SKIP) {
                        row.markSkipped("Matches existing patient " + row.getDuplicateOfMrn());
                        skipped++;
                        continue;
                    }
                    if (policy == DuplicatePolicy.FILL_BLANKS) {
                        Patient existing = row.getDuplicateOfId() == null ? null
                                : patientRepository.findById(row.getDuplicateOfId()).orElse(null);
                        if (existing == null || !job.getOrganizationId().equals(existing.getOrganizationId())) {
                            row.markFailed(null, "The patient this row matched no longer exists.");
                            failed++;
                            continue;
                        }
                        List<String> filled = patientService.fillBlanksFromImport(existing, request);
                        if (filled.isEmpty()) {
                            row.markSkipped("Existing patient " + existing.getMrn()
                                    + " already had everything in this row");
                            skipped++;
                        } else {
                            row.markUpdated(existing.getId(), "Filled in " + String.join(", ", filled));
                            updated++;
                        }
                        continue;
                    }
                    // IMPORT_AS_NEW: created deliberately, with the reason kept on the record.
                    request = withOverrideReason(request, "Bulk import " + job.getId()
                            + ": administrator chose to create this as a new patient");
                }

                Patient created = patientService.createFromImport(request, actor);
                row.markImported(created.getId());
                imported++;
            } catch (Exception e) {
                // One bad row must not lose the batch. The reason is kept against the row so it can
                // be corrected and retried; nothing about the patient is written to the log.
                row.markFailed(null, readableCause(e));
                failed++;
            }
        }

        rowRepository.saveAll(batch);
        return new BatchResult(batch.size(), imported, updated, skipped, failed);
    }

    private static String readableCause(Exception e) {
        if (e instanceof ApiException api) {
            return api.getMessage();
        }
        return "This row could not be saved. " + e.getClass().getSimpleName();
    }

    /** Re-reads a staged row into a patient request. */
    private UpsertRequest rebuild(PatientImportRow row) {
        Map<String, String> raw = readJson(row.getRawData());
        if (raw == null || raw.isEmpty()) {
            return null;
        }
        // The staged copy is keyed by field name, so it maps straight back without needing the
        // original column positions.
        Map<Integer, ImportField> identity = new LinkedHashMap<>();
        List<String> cells = new ArrayList<>();
        int index = 0;
        for (Map.Entry<String, String> entry : raw.entrySet()) {
            ImportField field;
            try {
                field = ImportField.valueOf(entry.getKey());
            } catch (IllegalArgumentException e) {
                continue;
            }
            identity.put(index, field);
            cells.add(entry.getValue());
            index++;
        }
        ImportRowMapper.Mapped mapped = ImportRowMapper.map(cells, identity);
        return mapped.ok() ? mapped.request() : null;
    }

    private static UpsertRequest withOverrideReason(UpsertRequest r, String reason) {
        return new UpsertRequest(r.salutation(), r.fullName(), r.nameLocal(), r.gender(), r.dateOfBirth(),
                r.approximateAgeYears(), r.bloodGroup(), r.maritalStatus(), r.occupation(), r.nationality(),
                r.preferredLanguage(), r.phone(), r.alternatePhone(), r.email(), r.address(), r.currentAddress(),
                r.emergencyContact(), r.category(), r.registrationChannel(), r.registrationBranch(), r.externalMrn(),
                r.referralSourceType(), r.referralSourceName(), r.referringDoctorId(), r.notes(), r.vip(),
                r.confidential(), r.deceased(), r.deceasedDate(), r.testRecord(), r.consent(), r.payer(),
                r.identifiers(), reason.length() > 300 ? reason.substring(0, 300) : reason);
    }

    @Transactional(readOnly = true)
    public Map<ImportRowStatus, Long> countsByStatus(Long jobId) {
        Map<ImportRowStatus, Long> counts = new LinkedHashMap<>();
        for (Object[] pair : rowRepository.countByStatus(jobId)) {
            counts.put((ImportRowStatus) pair[0], ((Number) pair[1]).longValue());
        }
        return counts;
    }

    private String writeJson(Map<String, String> raw) {
        try {
            return objectMapper.writeValueAsString(raw);
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
