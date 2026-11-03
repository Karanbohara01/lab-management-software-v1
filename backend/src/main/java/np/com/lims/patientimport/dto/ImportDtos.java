package np.com.lims.patientimport.dto;

import jakarta.validation.constraints.NotNull;
import np.com.lims.patientimport.entity.DuplicatePolicy;
import np.com.lims.patientimport.entity.ImportJobStatus;
import np.com.lims.patientimport.entity.ImportRowStatus;
import np.com.lims.patientimport.entity.PatientImportJob;
import np.com.lims.patientimport.entity.PatientImportRow;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/** Request and response shapes for the patient import wizard. */
public final class ImportDtos {

    private ImportDtos() {
    }

    /** One patient field a spreadsheet column can be pointed at. */
    public record FieldDefinition(String field, String label, boolean mandatory, String instruction, String example) {
    }

    /** One column of the uploaded file, with what it looks like it means and a few of its values. */
    public record ColumnSuggestion(int index, String header, String suggestedField, List<String> examples) {
    }

    public record UploadResult(
            JobSummary job,
            List<String> headers,
            List<ColumnSuggestion> columns,
            List<List<String>> sampleRows,
            /** An earlier import of a byte-identical file, when there is one — usually an accidental repeat. */
            JobSummary sameFileAs
    ) {
    }

    public record MappingRequest(
            /** Column index as a string, to the patient field it feeds. Unmapped columns are left out. */
            @NotNull Map<String, String> mapping
    ) {
    }

    public record ConfirmImportRequest(
            /** What to do with rows that firmly match an existing patient. Defaults to skipping them. */
            DuplicatePolicy duplicatePolicy,
            /**
             * What to do with rows that only share a name, gender and age with one. Defaults to
             * importing them as new, since a shared common name is usually a different person.
             */
            DuplicatePolicy weakMatchPolicy
    ) {
    }

    /** A job as it appears in the history list. */
    public record JobSummary(
            Long id,
            String filename,
            String fileFormat,
            long fileSizeBytes,
            ImportJobStatus status,
            int totalRows,
            int processedRows,
            int validRows,
            int invalidRows,
            int duplicateRows,
            int possibleDuplicateRows,
            int importedRows,
            int updatedRows,
            int skippedRows,
            int failedRows,
            int percentComplete,
            String importedBy,
            Instant createdAt,
            Instant startedAt,
            Instant completedAt,
            Long retryOfJobId,
            String failureMessage,
            boolean cancelRequested,
            boolean fileAvailable
    ) {
        public static JobSummary from(PatientImportJob j) {
            return new JobSummary(
                    j.getId(), j.getOriginalFilename(), j.getFileFormat(), j.getFileSizeBytes(), j.getStatus(),
                    j.getTotalRows(), j.getProcessedRows(), j.getValidRows(), j.getInvalidRows(), j.getDuplicateRows(),
                    j.getPossibleDuplicateRows(), j.getImportedRows(), j.getUpdatedRows(), j.getSkippedRows(), j.getFailedRows(),
                    percent(j), j.getCreatedBy(), j.getCreatedAt(), j.getStartedAt(), j.getCompletedAt(),
                    j.getRetryOfJobId(), j.getFailureMessage(), j.isCancelRequested(), j.getFileDeletedAt() == null);
        }

        /**
         * Real progress, from the counters the worker maintains — never an animation. A finished job
         * reads 100 even if its last batch rounded short.
         *
         * <p>The denominator changes with the pass, because the two passes cover different rows. The
         * check reads every row in the file. The import only touches the rows it can actually do
         * something with, so measuring it against the file total would stall the bar short of the
         * end and then jump — a file of 1,000 rows with 200 errors would never pass 80%.
         */
        private static int percent(PatientImportJob j) {
            if (j.getStatus().isTerminal()) {
                return 100;
            }
            int denominator = j.getStatus() == ImportJobStatus.IMPORTING
                    ? j.getValidRows() + j.getDuplicateRows() + j.getPossibleDuplicateRows()
                    : j.getTotalRows();
            if (denominator <= 0) {
                return 0;
            }
            return (int) Math.min(99, Math.round(100.0 * j.getProcessedRows() / denominator));
        }
    }

    /** A job with everything the wizard needs for the current step. */
    public record JobDetail(
            JobSummary job,
            Map<String, String> mapping,
            Map<String, Long> rowCounts,
            DuplicatePolicy duplicatePolicy,
            DuplicatePolicy weakMatchPolicy
    ) {
        public static JobDetail from(PatientImportJob j, Map<ImportRowStatus, Long> counts, Map<String, String> mapping,
                                     ImportOptions options) {
            Map<String, Long> byName = new java.util.LinkedHashMap<>();
            for (ImportRowStatus status : ImportRowStatus.values()) {
                byName.put(status.name(), counts.getOrDefault(status, 0L));
            }
            return new JobDetail(JobSummary.from(j), mapping, byName,
                    options == null ? null : options.duplicatePolicy(),
                    options == null ? null : options.weakMatchPolicy());
        }
    }

    /** The choices made at confirmation, as stored on the job. */
    public record ImportOptions(DuplicatePolicy duplicatePolicy, DuplicatePolicy weakMatchPolicy) {
        public static ImportOptions defaults() {
            return new ImportOptions(DuplicatePolicy.SKIP, DuplicatePolicy.IMPORT_AS_NEW);
        }

        public ImportOptions withDefaults() {
            return new ImportOptions(
                    duplicatePolicy == null ? DuplicatePolicy.SKIP : duplicatePolicy,
                    weakMatchPolicy == null ? DuplicatePolicy.IMPORT_AS_NEW : weakMatchPolicy);
        }
    }

    /** One staged row, as the preview and the error reports show it. */
    public record RowView(
            Long id,
            int rowNumber,
            ImportRowStatus status,
            String errorField,
            String errorMessage,
            String duplicateOfMrn,
            Long duplicateOfPatientId,
            Integer duplicateOfRow,
            String duplicateReason,
            Long patientId,
            Map<String, String> data
    ) {
        public static RowView from(PatientImportRow r, Map<String, String> data) {
            return new RowView(r.getId(), r.getRowNumber(), r.getStatus(), r.getErrorField(), r.getErrorMessage(),
                    r.getDuplicateOfMrn(), r.getDuplicateOfId(), r.getDuplicateOfRow(), r.getDuplicateReason(),
                    r.getPatientId(), data);
        }
    }
}
