package np.com.lims.backup;

import np.com.lims.backup.entity.BackupRun;
import np.com.lims.common.audit.AuditService;
import np.com.lims.common.exception.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.io.BufferedOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Types;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.zip.GZIPOutputStream;

/**
 * Backs up the whole database as a portable, human-inspectable gzipped SQL dump — every table's
 * rows as {@code INSERT} statements — via plain JDBC introspection, deliberately NOT shelling
 * out to {@code mysqldump}: this backend can run on a host with no MySQL client tools installed
 * (this dev environment's host has none), and a JDBC-based dump works identically regardless.
 *
 * <p>Satisfies the e-invoice procedure's mandatory backup requirement (दफा ६(ढ) / ८(घ)): every
 * fiscal year's database and log must be backed up, kept for as long as the transaction records
 * must be retained. This system does not delete old backup files on its own — that retention
 * decision is left to whoever administers the server's disk.
 *
 * <h2>This is a DATA-ONLY dump — restore requires the schema to already exist</h2>
 * The dump contains {@code INSERT} statements only, no {@code CREATE TABLE}s: this app's schema
 * is entirely managed by Flyway migrations (version-controlled in {@code db/migration}), so a
 * restore is: (1) point a fresh/empty MySQL database at this app and let Flyway run its
 * migrations to (re)create the schema, (2) then load this gzipped dump into it. Verified live
 * end-to-end on 2026-09-10: schema recreated via {@code mysqldump --no-data} of the live schema,
 * then this service's data dump loaded on top — every table's row count matched the source.
 * Loading this file into a truly empty database with no tables will fail outright; that failure
 * is expected, not a bug in the dump.
 */
@Service
public class DatabaseBackupService {

    private static final Logger log = LoggerFactory.getLogger(DatabaseBackupService.class);
    private static final String MODULE = "BACKUP";
    private static final DateTimeFormatter FILENAME_TS = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH-mm-ss")
            .withZone(java.time.ZoneOffset.UTC);
    private static final int BATCH_SIZE = 500;

    private final DataSource dataSource;
    private final BackupRunRepository repository;
    private final AuditService auditService;
    private final String backupDirectory;

    public DatabaseBackupService(DataSource dataSource,
                                 BackupRunRepository repository,
                                 AuditService auditService,
                                 @Value("${lims.backup.directory:./backups}") String backupDirectory) {
        this.dataSource = dataSource;
        this.repository = repository;
        this.auditService = auditService;
        this.backupDirectory = backupDirectory;
    }

    @Scheduled(cron = "${lims.backup.cron:0 0 2 * * *}")
    public void scheduledBackup() {
        log.info("Running scheduled database backup");
        run(null);
    }

    /** Runs a backup synchronously and returns once it has fully succeeded or failed. */
    public BackupRun run(String triggeredBy) {
        BackupRun tracking = beginTracking(triggeredBy);
        try {
            Path dir = Path.of(backupDirectory);
            Files.createDirectories(dir);
            Path file = dir.resolve("lims-backup-" + FILENAME_TS.format(Instant.now()) + ".sql.gz");

            DumpResult result = dump(file);

            finishSuccess(tracking.getId(), file.toAbsolutePath().toString(),
                    Files.size(file), result.tableCount(), result.rowCount());
            log.info("Backup completed: {} tables, {} rows, {} bytes -> {}",
                    result.tableCount(), result.rowCount(), Files.size(file), file);
        } catch (Exception ex) {
            log.error("Backup failed", ex);
            finishFailure(tracking.getId(), ex.getMessage() == null ? ex.getClass().getSimpleName() : ex.getMessage());
        }
        return repository.findById(tracking.getId()).orElseThrow();
    }

    @Transactional
    protected BackupRun beginTracking(String triggeredBy) {
        BackupRun run = repository.save(BackupRun.start(triggeredBy));
        auditService.record(MODULE, "START", "BackupRun", run.getId(),
                "Started database backup" + (triggeredBy == null ? " (scheduled)" : " (triggered by " + triggeredBy + ")"),
                null, null);
        return run;
    }

    @Transactional
    protected void finishSuccess(Long id, String filePath, long fileSizeBytes, int tableCount, long rowCount) {
        BackupRun run = repository.findById(id).orElseThrow();
        run.succeed(filePath, fileSizeBytes, tableCount, rowCount);
        // `run` is called via `this.` from run() (self-invocation), which bypasses the
        // @Transactional AOP proxy — so the usual "dirty-check on commit" auto-persist does NOT
        // apply here (confirmed live: the update was silently lost without this explicit save).
        repository.save(run);
        auditService.record(MODULE, "SUCCEED", "BackupRun", id,
                "Backup succeeded: " + tableCount + " tables, " + rowCount + " rows, " + fileSizeBytes + " bytes",
                null, null);
    }

    @Transactional
    protected void finishFailure(Long id, String errorMessage) {
        BackupRun run = repository.findById(id).orElseThrow();
        run.fail(errorMessage);
        repository.save(run);
        auditService.record(MODULE, "FAIL", "BackupRun", id, "Backup failed: " + errorMessage, null, null);
    }

    @Transactional(readOnly = true, propagation = Propagation.SUPPORTS)
    public Page<BackupRun> list(Pageable pageable) {
        return repository.findAllByOrderByStartedAtDesc(pageable);
    }

    @Transactional(readOnly = true, propagation = Propagation.SUPPORTS)
    public BackupRun get(Long id) {
        return repository.findById(id).orElseThrow(() -> ApiException.notFound("Backup run", id));
    }

    private record DumpResult(int tableCount, long rowCount) {
    }

    private DumpResult dump(Path file) throws SQLException, IOException {
        int tableCount = 0;
        long rowCount = 0;
        try (Connection conn = dataSource.getConnection();
             Writer out = new OutputStreamWriter(
                     new GZIPOutputStream(new BufferedOutputStream(Files.newOutputStream(file))), StandardCharsets.UTF_8)) {

            out.write("-- LabOS database backup — " + Instant.now() + "\n");
            out.write("SET FOREIGN_KEY_CHECKS=0;\n\n");

            for (String table : listTables(conn)) {
                out.write("-- Table: " + table + "\n");
                rowCount += dumpTable(conn, table, out);
                out.write("\n");
                tableCount++;
            }

            out.write("SET FOREIGN_KEY_CHECKS=1;\n");
        }
        return new DumpResult(tableCount, rowCount);
    }

    private List<String> listTables(Connection conn) throws SQLException {
        List<String> tables = new ArrayList<>();
        DatabaseMetaData meta = conn.getMetaData();
        try (ResultSet rs = meta.getTables(conn.getCatalog(), null, "%", new String[]{"TABLE"})) {
            while (rs.next()) {
                tables.add(rs.getString("TABLE_NAME"));
            }
        }
        return tables;
    }

    private long dumpTable(Connection conn, String table, Writer out) throws SQLException, IOException {
        long rows = 0;
        try (PreparedStatement stmt = conn.prepareStatement("SELECT * FROM `" + table + "`");
             ResultSet rs = stmt.executeQuery()) {
            ResultSetMetaData meta = rs.getMetaData();
            int columnCount = meta.getColumnCount();
            String[] columnNames = new String[columnCount];
            for (int i = 1; i <= columnCount; i++) {
                columnNames[i - 1] = meta.getColumnName(i);
            }
            String columnList = String.join(", ", quoteIdentifiers(columnNames));

            int inBatch = 0;
            while (rs.next()) {
                if (inBatch == 0) {
                    out.write("INSERT INTO `" + table + "` (" + columnList + ") VALUES\n");
                } else {
                    out.write(",\n");
                }
                out.write(rowLiteral(rs, meta, columnCount));
                inBatch++;
                rows++;
                if (inBatch >= BATCH_SIZE) {
                    out.write(";\n");
                    inBatch = 0;
                }
            }
            if (inBatch > 0) {
                out.write(";\n");
            }
        }
        return rows;
    }

    private String[] quoteIdentifiers(String[] names) {
        String[] quoted = new String[names.length];
        for (int i = 0; i < names.length; i++) {
            quoted[i] = "`" + names[i] + "`";
        }
        return quoted;
    }

    private String rowLiteral(ResultSet rs, ResultSetMetaData meta, int columnCount) throws SQLException {
        StringBuilder sb = new StringBuilder("(");
        for (int i = 1; i <= columnCount; i++) {
            if (i > 1) {
                sb.append(", ");
            }
            sb.append(valueLiteral(rs, meta, i));
        }
        return sb.append(")").toString();
    }

    private String valueLiteral(ResultSet rs, ResultSetMetaData meta, int col) throws SQLException {
        int type = meta.getColumnType(col);
        switch (type) {
            case Types.INTEGER, Types.BIGINT, Types.SMALLINT, Types.TINYINT, Types.FLOAT, Types.DOUBLE,
                 Types.DECIMAL, Types.NUMERIC, Types.REAL, Types.BOOLEAN, Types.BIT -> {
                String v = rs.getString(col);
                return rs.wasNull() || v == null ? "NULL" : v;
            }
            case Types.BLOB, Types.BINARY, Types.VARBINARY, Types.LONGVARBINARY -> {
                byte[] bytes = rs.getBytes(col);
                if (bytes == null) {
                    return "NULL";
                }
                StringBuilder hex = new StringBuilder("X'");
                for (byte b : bytes) {
                    hex.append(String.format("%02x", b));
                }
                return hex.append("'").toString();
            }
            default -> {
                String v = rs.getString(col);
                if (v == null) {
                    return "NULL";
                }
                return "'" + v.replace("\\", "\\\\").replace("'", "\\'") + "'";
            }
        }
    }
}
