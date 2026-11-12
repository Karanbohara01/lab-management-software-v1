package np.com.lims.patientimport.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import np.com.lims.common.audit.BaseEntity;
import np.com.lims.common.exception.ApiException;
import np.com.lims.common.tenant.TenantContext;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;

/**
 * One uploaded spreadsheet and everything that happened to it.
 *
 * <p>The counters here are what the progress screen reads. They are maintained by the worker as it
 * goes rather than computed on demand, because counting 500,000 staged rows on every poll would
 * cost more than the import itself.
 */
@Entity
@Table(name = "patient_import_job")
@Filter(name = "tenantFilter", condition = "organization_id = :tenantId")
public class PatientImportJob extends BaseEntity {

    @Column(name = "organization_id", nullable = false, updatable = false)
    private Long organizationId;

    @Column(name = "original_filename", nullable = false, length = 255)
    private String originalFilename;

    @Column(name = "stored_filename", nullable = false, length = 255)
    private String storedFilename;

    @Column(name = "file_format", nullable = false, length = 8)
    private String fileFormat;

    @Column(name = "file_size_bytes", nullable = false)
    private long fileSizeBytes;

    @Column(name = "file_checksum", length = 64)
    private String fileChecksum;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ImportJobStatus status = ImportJobStatus.UPLOADED;

    /** Source column index (0-based) to {@link np.com.lims.patientimport.ImportField} name, as JSON. */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "column_mapping")
    private String columnMapping;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "options")
    private String options;

    @Column(name = "sheet_name", length = 160)
    private String sheetName;

    @Column(name = "header_row", nullable = false)
    private int headerRow = 1;

    @Column(name = "total_rows", nullable = false)
    private int totalRows;
    @Column(name = "processed_rows", nullable = false)
    private int processedRows;
    @Column(name = "valid_rows", nullable = false)
    private int validRows;
    @Column(name = "invalid_rows", nullable = false)
    private int invalidRows;
    @Column(name = "duplicate_rows", nullable = false)
    private int duplicateRows;
    @Column(name = "possible_duplicate_rows", nullable = false)
    private int possibleDuplicateRows;
    @Column(name = "imported_rows", nullable = false)
    private int importedRows;
    @Column(name = "updated_rows", nullable = false)
    private int updatedRows;
    @Column(name = "skipped_rows", nullable = false)
    private int skippedRows;
    @Column(name = "failed_rows", nullable = false)
    private int failedRows;

    @Column(name = "claimed_by", length = 100)
    private String claimedBy;
    @Column(name = "claimed_at")
    private Instant claimedAt;
    @Column(name = "heartbeat_at")
    private Instant heartbeatAt;

    @Column(name = "started_at")
    private Instant startedAt;
    @Column(name = "analysed_at")
    private Instant analysedAt;
    @Column(name = "confirmed_at")
    private Instant confirmedAt;
    @Column(name = "completed_at")
    private Instant completedAt;
    @Column(name = "cancelled_at")
    private Instant cancelledAt;

    @Column(name = "cancel_requested", nullable = false)
    private boolean cancelRequested;

    @Column(name = "failure_message", length = 1000)
    private String failureMessage;

    @Column(name = "retry_of_job_id")
    private Long retryOfJobId;

    @Column(name = "file_deleted_at")
    private Instant fileDeletedAt;

    protected PatientImportJob() {
    }

    public static PatientImportJob forUpload(String originalFilename, String storedFilename, String fileFormat,
                                             long fileSizeBytes, String checksum, String sheetName, int headerRow) {
        PatientImportJob job = new PatientImportJob();
        job.originalFilename = originalFilename;
        job.storedFilename = storedFilename;
        job.fileFormat = fileFormat;
        job.fileSizeBytes = fileSizeBytes;
        job.fileChecksum = checksum;
        job.sheetName = sheetName;
        job.headerRow = headerRow;
        job.status = ImportJobStatus.UPLOADED;
        return job;
    }

    // ----- transitions ---------------------------------------------------------------------

    /** The administrator has confirmed the column mapping; the worker may now read the file. */
    public void queueForAnalysis(String columnMapping) {
        if (status != ImportJobStatus.UPLOADED && status != ImportJobStatus.READY) {
            throw ApiException.invalidTransition("This import is " + status + " and its mapping can no longer be changed");
        }
        this.columnMapping = columnMapping;
        this.status = ImportJobStatus.ANALYSING;
        this.cancelRequested = false;
        this.failureMessage = null;
        this.startedAt = this.startedAt == null ? Instant.now() : this.startedAt;
        resetAnalysisCounters();
    }

    public void analysisFinished() {
        this.status = ImportJobStatus.READY;
        this.analysedAt = Instant.now();
        releaseClaim();
    }

    /** The administrator has seen the preview and asked for the patients to be created. */
    public void queueForImport(String options) {
        if (status != ImportJobStatus.READY) {
            throw ApiException.invalidTransition("This import is " + status + " and cannot be started");
        }
        this.options = options;
        this.status = ImportJobStatus.IMPORTING;
        this.confirmedAt = Instant.now();
        this.cancelRequested = false;
        this.processedRows = 0;
        releaseClaim();
    }

    public void importFinished() {
        this.status = this.cancelRequested ? ImportJobStatus.CANCELLED : ImportJobStatus.COMPLETED;
        this.completedAt = Instant.now();
        if (this.cancelRequested) {
            this.cancelledAt = Instant.now();
        }
        releaseClaim();
    }

    /** Asks the worker to stop at the end of its current batch. Patients already created are kept. */
    public void requestCancel() {
        if (status.isTerminal()) {
            throw ApiException.invalidTransition("This import has already finished");
        }
        this.cancelRequested = true;
        if (status == ImportJobStatus.UPLOADED || status == ImportJobStatus.READY) {
            this.status = ImportJobStatus.CANCELLED;
            this.cancelledAt = Instant.now();
            releaseClaim();
        }
    }

    public void fail(String message) {
        this.status = ImportJobStatus.FAILED;
        this.failureMessage = message == null ? null : message.substring(0, Math.min(message.length(), 1000));
        this.completedAt = Instant.now();
        releaseClaim();
    }

    // ----- worker lease --------------------------------------------------------------------

    public void claim(String worker) {
        this.claimedBy = worker;
        this.claimedAt = Instant.now();
        this.heartbeatAt = Instant.now();
    }

    public void heartbeat() {
        this.heartbeatAt = Instant.now();
    }

    private void releaseClaim() {
        this.claimedBy = null;
        this.claimedAt = null;
        this.heartbeatAt = null;
    }

    private void resetAnalysisCounters() {
        this.totalRows = 0;
        this.processedRows = 0;
        this.validRows = 0;
        this.invalidRows = 0;
        this.duplicateRows = 0;
        this.possibleDuplicateRows = 0;
    }

    // ----- counters ------------------------------------------------------------------------

    public void recordAnalysisTotals(int total, int valid, int invalid, int duplicate, int possibleDuplicate) {
        this.totalRows = total;
        this.processedRows = total;
        this.validRows = valid;
        this.invalidRows = invalid;
        this.duplicateRows = duplicate;
        this.possibleDuplicateRows = possibleDuplicate;
    }

    public void addImportProgress(int processed, int imported, int updated, int skipped, int failed) {
        this.processedRows += processed;
        this.importedRows += imported;
        this.updatedRows += updated;
        this.skippedRows += skipped;
        this.failedRows += failed;
    }

    public void markFileDeleted() {
        this.fileDeletedAt = Instant.now();
    }

    public void setRetryOfJobId(Long retryOfJobId) {
        this.retryOfJobId = retryOfJobId;
    }

    public void setTotalRows(int totalRows) {
        this.totalRows = totalRows;
    }

    @PrePersist
    private void assignTenant() {
        if (organizationId == null) {
            organizationId = TenantContext.require();
        }
    }

    // ----- getters -------------------------------------------------------------------------

    public Long getOrganizationId() {
        return organizationId;
    }

    public String getOriginalFilename() {
        return originalFilename;
    }

    public String getStoredFilename() {
        return storedFilename;
    }

    public String getFileFormat() {
        return fileFormat;
    }

    public long getFileSizeBytes() {
        return fileSizeBytes;
    }

    public String getFileChecksum() {
        return fileChecksum;
    }

    public ImportJobStatus getStatus() {
        return status;
    }

    public String getColumnMapping() {
        return columnMapping;
    }

    public String getOptions() {
        return options;
    }

    public String getSheetName() {
        return sheetName;
    }

    public int getHeaderRow() {
        return headerRow;
    }

    public int getTotalRows() {
        return totalRows;
    }

    public int getProcessedRows() {
        return processedRows;
    }

    public int getValidRows() {
        return validRows;
    }

    public int getInvalidRows() {
        return invalidRows;
    }

    public int getDuplicateRows() {
        return duplicateRows;
    }

    public int getPossibleDuplicateRows() {
        return possibleDuplicateRows;
    }

    public int getImportedRows() {
        return importedRows;
    }

    public int getUpdatedRows() {
        return updatedRows;
    }

    public int getSkippedRows() {
        return skippedRows;
    }

    public int getFailedRows() {
        return failedRows;
    }

    public String getClaimedBy() {
        return claimedBy;
    }

    public Instant getHeartbeatAt() {
        return heartbeatAt;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public Instant getAnalysedAt() {
        return analysedAt;
    }

    public Instant getConfirmedAt() {
        return confirmedAt;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }

    public Instant getCancelledAt() {
        return cancelledAt;
    }

    public boolean isCancelRequested() {
        return cancelRequested;
    }

    public String getFailureMessage() {
        return failureMessage;
    }

    public Long getRetryOfJobId() {
        return retryOfJobId;
    }

    public Instant getFileDeletedAt() {
        return fileDeletedAt;
    }
}
