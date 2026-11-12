package np.com.lims.patientimport;

import np.com.lims.common.audit.AuditService;
import np.com.lims.common.exception.ApiException;
import np.com.lims.common.tenant.TenantContext;
import np.com.lims.patientimport.entity.DuplicatePolicy;
import np.com.lims.patientimport.entity.ImportJobStatus;
import np.com.lims.patientimport.entity.ImportRowStatus;
import np.com.lims.patientimport.entity.PatientImportJob;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionException;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * The background worker that actually runs imports.
 *
 * <p>Built on the same {@code @Scheduled} polling the IRD retry and notification sweeper already
 * use, rather than a thread pool, because the requirement is that an interrupted import resumes.
 * State lives in the database, not in a queue in memory: a server killed halfway through leaves a
 * job whose lease goes stale, and the next server to look picks it up and carries on from the rows
 * that have no outcome yet.
 *
 * <p>Two things are set by hand on every pass, because this thread is not an HTTP request and gets
 * neither for free:
 * <ul>
 *   <li>The tenant, from the job's own organization — without it the patient entity's tenant stamp
 *       would fail outright.</li>
 *   <li>The acting user, from who uploaded the file, since there is no security context to read.</li>
 * </ul>
 */
@Component
public class PatientImportWorker {

    private static final Logger log = LoggerFactory.getLogger(PatientImportWorker.class);
    private static final String MODULE = "PATIENT_IMPORT";

    /** Work done per scheduled tick, so one large import cannot monopolise the scheduler. */
    private static final int BATCHES_PER_TICK = 10;

    private final PatientImportJobRepository jobRepository;
    private final PatientImportRowRepository rowRepository;
    private final PatientImportEngine engine;
    private final PatientImportService importService;
    private final ImportFileStore fileStore;
    private final AuditService auditService;
    private final int batchSize;
    private final Duration leaseTimeout;
    private final Duration fileRetention;
    private final String workerId;
    /**
     * Explicit, for the same reason as the engine: these units are driven from {@code pump} on
     * this same object, and an annotation on a self-invoked method is never applied.
     */
    private final TransactionTemplate transaction;

    public PatientImportWorker(PatientImportJobRepository jobRepository,
                               PatientImportRowRepository rowRepository,
                               PatientImportEngine engine,
                               PatientImportService importService,
                               ImportFileStore fileStore,
                               AuditService auditService,
                               @Value("${lims.patient-import.batch-size:200}") int batchSize,
                               @Value("${lims.patient-import.lease-timeout:PT5M}") Duration leaseTimeout,
                               PlatformTransactionManager transactionManager,
                               @Value("${lims.patient-import.file-retention:P7D}") Duration fileRetention) {
        this.jobRepository = jobRepository;
        this.rowRepository = rowRepository;
        this.engine = engine;
        this.importService = importService;
        this.fileStore = fileStore;
        this.auditService = auditService;
        this.batchSize = Math.max(1, batchSize);
        this.leaseTimeout = leaseTimeout;
        this.fileRetention = fileRetention;
        this.workerId = workerName();
        this.transaction = new TransactionTemplate(transactionManager);
        this.transaction.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    private static String workerName() {
        try {
            return java.net.InetAddress.getLocalHost().getHostName() + ":" + ProcessHandle.current().pid();
        } catch (Exception e) {
            return "worker:" + ProcessHandle.current().pid();
        }
    }

    /**
     * Picks up one job and moves it along. Deliberately one at a time: the scheduler runs on a
     * single thread, so taking one job per tick keeps the other scheduled jobs — backups, IRD
     * retries, the notification sweep — running on time while a long migration is in progress.
     */
    @Scheduled(cron = "${lims.patient-import.worker-cron:*/5 * * * * *}")
    public void pump() {
        PatientImportJob job = claimNext();
        if (job == null) {
            return;
        }
        Long orgId = job.getOrganizationId();
        try {
            // The tenant is not on this thread. Every query the engine runs names the organization
            // explicitly as well, but new patient rows are stamped from here.
            TenantContext.set(orgId);
            if (job.getStatus() == ImportJobStatus.ANALYSING) {
                runAnalysis(job);
            } else if (job.getStatus() == ImportJobStatus.IMPORTING) {
                runImport(job);
            }
        } catch (ApiException e) {
            failJob(job.getId(), e.getMessage());
        } catch (Exception e) {
            // The message is deliberately generic: an exception from a row could otherwise carry
            // patient data into the log and into a field the administrator sees.
            log.error("Patient import job {} failed", job.getId(), e);
            failJob(job.getId(), "The import stopped unexpectedly. Nothing further was imported.");
        } finally {
            TenantContext.clear();
        }
    }

    /**
     * Takes ownership of the oldest runnable job. The lease is written in its own transaction, and
     * the entity's version column makes the claim atomic: if two servers look at the same moment,
     * one writes and the other's optimistic-lock failure sends it away empty-handed.
     */
    private PatientImportJob claimNext() {
        List<PatientImportJob> candidates = transaction.execute(status -> jobRepository.findClaimable(
                List.of(ImportJobStatus.ANALYSING, ImportJobStatus.IMPORTING),
                workerId,
                Instant.now().minus(leaseTimeout),
                PageRequest.of(0, 5)));
        if (candidates == null) {
            return null;
        }
        for (PatientImportJob candidate : candidates) {
            PatientImportJob claimed = tryClaim(candidate.getId());
            if (claimed != null) {
                return claimed;
            }
        }
        return null;
    }

    /**
     * One attempt at one job, in its own transaction.
     *
     * <p>The separate transaction per attempt is the point. A lost race fails the write, and that
     * failure marks its transaction rollback-only — so catching it and trying the next job inside
     * the same transaction would leave a doomed one that throws at commit having looked successful.
     * Each attempt therefore gets a transaction it alone can spoil.
     */
    private PatientImportJob tryClaim(Long id) {
        Instant staleBefore = Instant.now().minus(leaseTimeout);
        try {
            return transaction.execute(status -> jobRepository.findById(id)
                    .filter(j -> j.getStatus().isRunning())
                    // Re-tested on the freshly loaded row: the search that found this job and this
                    // write are separate transactions, and another worker may have claimed it in
                    // between. Without this the optimistic lock cannot help, because the row loaded
                    // here already carries that worker's version.
                    .filter(j -> j.getClaimedBy() == null
                            || workerId.equals(j.getClaimedBy())
                            || j.getHeartbeatAt() == null
                            || j.getHeartbeatAt().isBefore(staleBefore))
                    .map(j -> {
                        j.claim(workerId);
                        return jobRepository.saveAndFlush(j);
                    })
                    .orElse(null));
        } catch (OptimisticLockingFailureException | TransactionException e) {
            // Another worker took it between the search and the write.
            return null;
        }
    }

    // ----- the analysis pass ----------------------------------------------------------------

    private void runAnalysis(PatientImportJob job) {
        Map<Integer, ImportField> mapping = PatientImportService.parseMapping(readMapping(job));
        PatientImportEngine.AnalysisResult result = engine.analyse(job, mapping, () -> heartbeat(job.getId()));
        finishAnalysis(job.getId(), result);
    }

    private void finishAnalysis(Long jobId, PatientImportEngine.AnalysisResult result) {
        transaction.executeWithoutResult(status -> jobRepository.findById(jobId).ifPresent(job -> {
            job.recordAnalysisTotals(result.total(), result.valid(), result.invalid(), result.duplicate(),
                    result.possibleDuplicate());
            job.analysisFinished();
            jobRepository.save(job);
            auditService.record(MODULE, "ANALYSED", "PatientImportJob", jobId,
                    PatientImportService.truncate("Checked " + job.getOriginalFilename() + ": " + result.total()
                            + " rows, " + result.valid() + " ready to import, " + result.invalid()
                            + " with errors, " + result.duplicate() + " matching existing patients, "
                            + result.possibleDuplicate() + " possible matches"), null, null);
        }));
    }

    // ----- the import pass ------------------------------------------------------------------

    private void runImport(PatientImportJob job) {
        np.com.lims.patientimport.dto.ImportDtos.ImportOptions options = importService.readOptions(job);
        if (options == null) {
            options = np.com.lims.patientimport.dto.ImportDtos.ImportOptions.defaults();
        }
        DuplicatePolicy policy = options.duplicatePolicy();
        DuplicatePolicy weakPolicy = options.weakMatchPolicy();
        String actor = job.getCreatedBy() == null ? "system" : job.getCreatedBy();

        for (int i = 0; i < BATCHES_PER_TICK; i++) {
            if (isCancelled(job.getId())) {
                finishImport(job.getId(), true);
                return;
            }
            PatientImportEngine.BatchResult result;
            try {
                result = engine.importBatch(job, policy, weakPolicy, actor, batchSize);
            } catch (DataAccessException | TransactionException | jakarta.persistence.PersistenceException e) {
                // A failure inside the database write itself poisons the batch's transaction, and
                // the whole batch rolls back. Rather than fail the job for one row, find the row.
                log.warn("Patient import job {}: a batch of {} failed at the database and will be retried one row at a time",
                        job.getId(), batchSize);
                result = isolateFailingRows(job, policy, weakPolicy, actor);
            }
            recordProgress(job.getId(), result);
            if (result.didNothing()) {
                finishImport(job.getId(), false);
                return;
            }
        }
        // More to do: leave the job claimed and running, and let the next tick continue it.
        heartbeat(job.getId());
    }

    /**
     * Re-runs one batch's worth of rows one at a time. A row that fails on its own is settled as
     * failed, with a reason the administrator can act on, and the rest go through. The next tick
     * returns to full batches.
     */
    private PatientImportEngine.BatchResult isolateFailingRows(PatientImportJob job, DuplicatePolicy policy,
                                                               DuplicatePolicy weakPolicy, String actor) {
        int processed = 0;
        int imported = 0;
        int updated = 0;
        int skipped = 0;
        int failed = 0;
        for (int i = 0; i < batchSize; i++) {
            try {
                PatientImportEngine.BatchResult one = engine.importBatch(job, policy, weakPolicy, actor, 1);
                if (one.didNothing()) {
                    break;
                }
                processed += one.processed();
                imported += one.imported();
                updated += one.updated();
                skipped += one.skipped();
                failed += one.failed();
            } catch (DataAccessException | TransactionException | jakarta.persistence.PersistenceException e) {
                int settled = engine.failFirstPending(job, policy,
                        "Could not be saved to the database. Check this row's values against the patient "
                                + "record's limits, correct the file and import it again.");
                processed += settled;
                failed += settled;
                if (settled == 0) {
                    break;
                }
            }
        }
        return new PatientImportEngine.BatchResult(processed, imported, updated, skipped, failed);
    }

    private void recordProgress(Long jobId, PatientImportEngine.BatchResult r) {
        transaction.executeWithoutResult(status -> jobRepository.findById(jobId).ifPresent(job -> {
            job.addImportProgress(r.processed(), r.imported(), r.updated(), r.skipped(), r.failed());
            job.heartbeat();
            jobRepository.save(job);
        }));
    }

    private void heartbeat(Long jobId) {
        transaction.executeWithoutResult(status -> jobRepository.findById(jobId).ifPresent(job -> {
            job.heartbeat();
            jobRepository.save(job);
        }));
    }

    private boolean isCancelled(Long jobId) {
        return Boolean.TRUE.equals(transaction.execute(status ->
                jobRepository.findById(jobId).map(PatientImportJob::isCancelRequested).orElse(true)));
    }

    private void finishImport(Long jobId, boolean cancelled) {
        transaction.executeWithoutResult(status -> jobRepository.findById(jobId).ifPresent(job -> {
            if (cancelled) {
                // Anything not yet processed is settled rather than left looking pending forever.
                // Patients already created stay: they are real records now.
                int left = rowRepository.markRemaining(job.getId(),
                        List.of(ImportRowStatus.VALID, ImportRowStatus.DUPLICATE, ImportRowStatus.DUPLICATE_IN_FILE,
                                ImportRowStatus.POSSIBLE_DUPLICATE, ImportRowStatus.PENDING),
                        "Not imported: the import was cancelled");
                job.addImportProgress(left, 0, 0, left, 0);
            }
            job.importFinished();
            jobRepository.save(job);
            auditService.record(MODULE, cancelled ? "CANCELLED" : "COMPLETED", "PatientImportJob", jobId,
                    PatientImportService.truncate((cancelled ? "Cancelled" : "Finished") + " importing "
                            + job.getOriginalFilename() + ": " + job.getImportedRows() + " patients created, "
                            + job.getUpdatedRows() + " updated, " + job.getSkippedRows() + " skipped, "
                            + job.getFailedRows() + " failed"), null, null);
        }));
    }

    private void failJob(Long jobId, String message) {
        transaction.executeWithoutResult(status -> jobRepository.findById(jobId).ifPresent(job -> {
            if (job.getStatus() == ImportJobStatus.ANALYSING) {
                // The check never finished, so what it staged is partial and nothing will read it:
                // the failure message is about the file, and a retry is a fresh upload.
                rowRepository.deleteByJobId(jobId);
            }
            job.fail(message);
            jobRepository.save(job);
            auditService.record(MODULE, "FAILED", "PatientImportJob", jobId,
                    PatientImportService.truncate("Import of " + job.getOriginalFilename() + " failed: " + message),
                    null, null);
        }));
    }

    // ----- housekeeping ---------------------------------------------------------------------

    /**
     * Deletes uploaded files once their job has been finished long enough. A clinic's patient list
     * is the most sensitive thing this system will ever be handed, and there is no reason to keep
     * the original once the import is done — the staged rows and the reports remain.
     */
    @Scheduled(cron = "${lims.patient-import.purge-cron:0 15 3 * * *}")
    @Transactional
    public void purgeOldFiles() {
        List<PatientImportJob> stale = jobRepository.findFilesToPurge(
                Instant.now().minus(fileRetention), PageRequest.of(0, 100));
        for (PatientImportJob job : stale) {
            fileStore.delete(job.getOrganizationId(), job.getStoredFilename());
            job.markFileDeleted();
        }
        if (!stale.isEmpty()) {
            jobRepository.saveAll(stale);
            log.info("Removed {} uploaded patient import file(s) past their retention window", stale.size());
        }
    }

    private Map<String, String> readMapping(PatientImportJob job) {
        try {
            return new com.fasterxml.jackson.databind.ObjectMapper().readValue(
                    job.getColumnMapping() == null ? "{}" : job.getColumnMapping(),
                    new com.fasterxml.jackson.core.type.TypeReference<java.util.LinkedHashMap<String, String>>() {
                    });
        } catch (Exception e) {
            throw new ApiException(np.com.lims.common.exception.ErrorCode.INTERNAL_ERROR,
                    "The column mapping for this import could not be read. Set it again.");
        }
    }
}
