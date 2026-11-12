package np.com.lims.patientimport.entity;

/**
 * Where an import has got to. The administrator drives the transitions marked below; everything
 * else is the background worker.
 *
 * <pre>
 *   UPLOADED ──(confirm mapping)──▶ ANALYSING ──▶ READY ──(confirm import)──▶ IMPORTING ──▶ COMPLETED
 *       │                              │           │                            │
 *       └──────────────────────────────┴───────────┴────────────────────────────┴──▶ CANCELLED / FAILED
 * </pre>
 */
public enum ImportJobStatus {

    /** File stored and its header read. Waiting for the administrator to confirm the column mapping. */
    UPLOADED,

    /** The worker is reading every row, validating it and looking for duplicates. No patient exists yet. */
    ANALYSING,

    /** Every row analysed. The preview is complete and the administrator can confirm the import. */
    READY,

    /** The worker is creating patients, batch by batch. */
    IMPORTING,

    /** Every row that was going to be imported has been. */
    COMPLETED,

    /** Stopped on request. Patients already created by a cancelled import are kept — they are real records. */
    CANCELLED,

    /** The file could not be read, or the job hit an error it could not continue past. */
    FAILED;

    /** True while the background worker owns this job. */
    public boolean isRunning() {
        return this == ANALYSING || this == IMPORTING;
    }

    /** True once nothing further will happen without the administrator starting something new. */
    public boolean isTerminal() {
        return this == COMPLETED || this == CANCELLED || this == FAILED;
    }
}
