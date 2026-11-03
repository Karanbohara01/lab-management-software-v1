package np.com.lims.patientimport.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.time.LocalDate;

/**
 * One row of an uploaded spreadsheet, staged before anything is created.
 *
 * <p>Staging every row — not just the problem ones — is what makes the import restartable and
 * retry-safe. A row that has produced a patient carries that patient's id, so a worker that comes
 * back after a crash can tell at a glance what is already done.
 *
 * <p>Deliberately not a {@code BaseEntity}: there are up to 500,000 of these per job and they are
 * scratch data, so they carry no optimistic-lock version, no audit columns and no updated-at. The
 * organization id is stored anyway so a query can scope itself without joining the job.
 */
@Entity
@Table(name = "patient_import_row")
public class PatientImportRow {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "organization_id", nullable = false, updatable = false)
    private Long organizationId;

    @Column(name = "job_id", nullable = false, updatable = false)
    private Long jobId;

    @Column(name = "source_row", nullable = false, updatable = false)
    private int rowNumber;

    /** The row as read, field name to raw cell text. Kept verbatim so an error report can show it back. */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "raw_data", nullable = false)
    private String rawData;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private ImportRowStatus status = ImportRowStatus.PENDING;

    @Column(name = "error_field", length = 64)
    private String errorField;

    @Column(name = "error_message", length = 500)
    private String errorMessage;

    @Column(name = "dedup_external_id", length = 64)
    private String dedupExternalId;

    @Column(name = "dedup_phone", length = 16)
    private String dedupPhone;

    @Column(name = "dedup_name_key", length = 191)
    private String dedupNameKey;

    @Column(name = "dedup_dob")
    private LocalDate dedupDob;

    @Column(name = "duplicate_of_id")
    private Long duplicateOfId;

    @Column(name = "duplicate_of_mrn", length = 24)
    private String duplicateOfMrn;

    @Column(name = "duplicate_reason", length = 255)
    private String duplicateReason;

    @Column(name = "duplicate_of_row")
    private Integer duplicateOfRow;

    @Column(name = "patient_id")
    private Long patientId;

    @Column(name = "imported_at")
    private Instant importedAt;

    protected PatientImportRow() {
    }

    public PatientImportRow(Long organizationId, Long jobId, int rowNumber, String rawData) {
        this.organizationId = organizationId;
        this.jobId = jobId;
        this.rowNumber = rowNumber;
        this.rawData = rawData;
        this.status = ImportRowStatus.PENDING;
    }

    public void markValid(String externalId, String phone, String nameKey, LocalDate dob) {
        this.status = ImportRowStatus.VALID;
        this.dedupExternalId = externalId;
        this.dedupPhone = phone;
        this.dedupNameKey = nameKey;
        this.dedupDob = dob;
        this.errorField = null;
        this.errorMessage = null;
    }

    public void markInvalid(String field, String message) {
        this.status = ImportRowStatus.INVALID;
        this.errorField = field;
        this.errorMessage = truncate(message);
    }

    public void markDuplicateOfPatient(Long patientId, String mrn, String reason) {
        this.status = ImportRowStatus.DUPLICATE;
        this.duplicateOfId = patientId;
        this.duplicateOfMrn = mrn;
        this.duplicateReason = truncate255(reason);
    }

    public void markDuplicateOfRow(int earlierRow, String reason) {
        this.status = ImportRowStatus.DUPLICATE_IN_FILE;
        this.duplicateOfRow = earlierRow;
        this.duplicateReason = truncate255(reason);
    }

    public void markImported(Long patientId) {
        this.status = ImportRowStatus.IMPORTED;
        this.patientId = patientId;
        this.importedAt = Instant.now();
        this.errorField = null;
        this.errorMessage = null;
    }

    public void markUpdated(Long patientId, String whatChanged) {
        this.status = ImportRowStatus.UPDATED;
        this.patientId = patientId;
        this.importedAt = Instant.now();
        this.duplicateReason = truncate255(whatChanged);
    }

    public void markSkipped(String reason) {
        this.status = ImportRowStatus.SKIPPED;
        this.errorMessage = truncate(reason);
    }

    public void markFailed(String field, String message) {
        this.status = ImportRowStatus.FAILED;
        this.errorField = field;
        this.errorMessage = truncate(message);
    }

    private static String truncate(String value) {
        return value == null ? null : value.substring(0, Math.min(value.length(), 500));
    }

    private static String truncate255(String value) {
        return value == null ? null : value.substring(0, Math.min(value.length(), 255));
    }

    public Long getId() {
        return id;
    }

    public Long getJobId() {
        return jobId;
    }

    public Long getOrganizationId() {
        return organizationId;
    }

    public int getRowNumber() {
        return rowNumber;
    }

    public String getRawData() {
        return rawData;
    }

    public ImportRowStatus getStatus() {
        return status;
    }

    public String getErrorField() {
        return errorField;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public String getDedupExternalId() {
        return dedupExternalId;
    }

    public String getDedupPhone() {
        return dedupPhone;
    }

    public String getDedupNameKey() {
        return dedupNameKey;
    }

    public LocalDate getDedupDob() {
        return dedupDob;
    }

    public Long getDuplicateOfId() {
        return duplicateOfId;
    }

    public String getDuplicateOfMrn() {
        return duplicateOfMrn;
    }

    public String getDuplicateReason() {
        return duplicateReason;
    }

    public Integer getDuplicateOfRow() {
        return duplicateOfRow;
    }

    public Long getPatientId() {
        return patientId;
    }

    public Instant getImportedAt() {
        return importedAt;
    }
}
