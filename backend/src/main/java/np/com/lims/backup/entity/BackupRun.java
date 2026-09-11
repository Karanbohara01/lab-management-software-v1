package np.com.lims.backup.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

/**
 * One database backup run — scheduled or manually triggered. Tracks outcome honestly: a run
 * that fails partway is marked FAILED with the error, never silently reported as a success.
 */
@Entity
@Table(name = "backup_run")
public class BackupRun {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private BackupStatus status;

    @Column(name = "started_at", nullable = false)
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "file_path", length = 500)
    private String filePath;

    @Column(name = "file_size_bytes")
    private Long fileSizeBytes;

    @Column(name = "table_count")
    private Integer tableCount;

    @Column(name = "row_count")
    private Long rowCount;

    @Column(name = "error_message", length = 1000)
    private String errorMessage;

    /** Null = triggered by the scheduled job rather than a person. */
    @Column(name = "triggered_by", length = 100)
    private String triggeredBy;

    protected BackupRun() {
    }

    public static BackupRun start(String triggeredBy) {
        BackupRun run = new BackupRun();
        run.status = BackupStatus.RUNNING;
        run.startedAt = Instant.now();
        run.triggeredBy = triggeredBy;
        return run;
    }

    public void succeed(String filePath, long fileSizeBytes, int tableCount, long rowCount) {
        this.status = BackupStatus.SUCCEEDED;
        this.completedAt = Instant.now();
        this.filePath = filePath;
        this.fileSizeBytes = fileSizeBytes;
        this.tableCount = tableCount;
        this.rowCount = rowCount;
    }

    public void fail(String errorMessage) {
        this.status = BackupStatus.FAILED;
        this.completedAt = Instant.now();
        this.errorMessage = errorMessage;
    }

    public Long getId() {
        return id;
    }

    public BackupStatus getStatus() {
        return status;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }

    public String getFilePath() {
        return filePath;
    }

    public Long getFileSizeBytes() {
        return fileSizeBytes;
    }

    public Integer getTableCount() {
        return tableCount;
    }

    public Long getRowCount() {
        return rowCount;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public String getTriggeredBy() {
        return triggeredBy;
    }
}
