-- ---------------------------------------------------------------------------
-- V73  Bulk patient import / data migration.
--
--      A clinic arriving from other software brings its existing patient list
--      as a spreadsheet. Importing it is a long job over a large file, so it
--      cannot live inside one HTTP request: the upload is staged, every row is
--      analysed and stored, the administrator confirms, and a background worker
--      creates the patients in batches.
--
--      Two tables:
--        patient_import_job  one per uploaded file, carrying the mapping the
--                            administrator confirmed, the counters the progress
--                            screen reads, and a lease so a restarted server
--                            resumes a job instead of running it twice.
--        patient_import_row  one per spreadsheet row. Staging every row (not
--                            just the bad ones) is what makes the import
--                            restartable, retry-safe and auditable: a row that
--                            has already produced a patient carries that
--                            patient's id, so re-running can never insert it
--                            again.
--
--      The dedup_* columns hold the normalised keys the duplicate pass matches
--      on, so both within-file and against-database detection are set-based
--      queries rather than a lookup per row.
-- ---------------------------------------------------------------------------

CREATE TABLE patient_import_job (
    id                  BIGINT        NOT NULL AUTO_INCREMENT,
    organization_id     BIGINT        NOT NULL,

    original_filename   VARCHAR(255)  NOT NULL,
    stored_filename     VARCHAR(255)  NOT NULL,
    file_format         VARCHAR(8)    NOT NULL,
    file_size_bytes     BIGINT        NOT NULL DEFAULT 0,
    -- SHA-256 of the upload. Two uploads of the same bytes are flagged to the
    -- administrator, which is the common shape of an accidental double import.
    file_checksum       VARCHAR(64),

    status              VARCHAR(32)   NOT NULL,
    -- Column letter -> patient field, as confirmed by the administrator.
    column_mapping      JSON,
    -- Duplicate policy and other choices made at confirmation time.
    options             JSON,
    sheet_name          VARCHAR(160),
    header_row          INT           NOT NULL DEFAULT 1,

    total_rows          INT           NOT NULL DEFAULT 0,
    processed_rows      INT           NOT NULL DEFAULT 0,
    valid_rows          INT           NOT NULL DEFAULT 0,
    invalid_rows        INT           NOT NULL DEFAULT 0,
    duplicate_rows      INT           NOT NULL DEFAULT 0,
    imported_rows       INT           NOT NULL DEFAULT 0,
    updated_rows        INT           NOT NULL DEFAULT 0,
    skipped_rows        INT           NOT NULL DEFAULT 0,
    failed_rows         INT           NOT NULL DEFAULT 0,

    -- Lease: which worker holds this job and when it last said so. A job whose
    -- heartbeat has gone stale is reclaimable, which is how a killed server's
    -- half-finished import gets picked up again.
    claimed_by          VARCHAR(100),
    claimed_at          DATETIME(6),
    heartbeat_at        DATETIME(6),

    started_at          DATETIME(6),
    analysed_at         DATETIME(6),
    confirmed_at        DATETIME(6),
    completed_at        DATETIME(6),
    cancelled_at        DATETIME(6),
    cancel_requested    BOOLEAN       NOT NULL DEFAULT FALSE,
    -- Never holds patient data: a failure message about the file, not its contents.
    failure_message     VARCHAR(1000),

    -- The job this one retries, so a corrected re-upload is traceable to it.
    retry_of_job_id     BIGINT,
    file_deleted_at     DATETIME(6),

    version             BIGINT        NOT NULL DEFAULT 0,
    created_at          DATETIME(6)   NOT NULL,
    updated_at          DATETIME(6)   NOT NULL,
    created_by          VARCHAR(100),
    updated_by          VARCHAR(100),

    PRIMARY KEY (id),
    CONSTRAINT fk_patient_import_job_org FOREIGN KEY (organization_id) REFERENCES organization(id),
    CONSTRAINT fk_patient_import_job_retry FOREIGN KEY (retry_of_job_id) REFERENCES patient_import_job(id),
    INDEX ix_patient_import_job_org_created (organization_id, created_at),
    -- The worker's claim query: find runnable jobs without scanning the table.
    INDEX ix_patient_import_job_status (status, heartbeat_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;


CREATE TABLE patient_import_row (
    id                  BIGINT        NOT NULL AUTO_INCREMENT,
    organization_id     BIGINT        NOT NULL,
    job_id              BIGINT        NOT NULL,

    -- The row's line number in the uploaded file, 1-based including the header, so an error report
    -- points at what the administrator sees in Excel. Not called row_number: that is a reserved
    -- word in MySQL 8 (the window function) and would need quoting everywhere it appears.
    source_row          INT           NOT NULL,
    -- The row exactly as it was read, field name -> raw cell text.
    raw_data            JSON          NOT NULL,

    status              VARCHAR(24)   NOT NULL,
    error_field         VARCHAR(64),
    error_message       VARCHAR(500),

    -- Normalised duplicate keys, written during analysis.
    dedup_external_id   VARCHAR(64),
    dedup_phone         VARCHAR(16),
    dedup_name_key      VARCHAR(191),
    dedup_dob           DATE,

    duplicate_of_id     BIGINT,
    duplicate_of_mrn    VARCHAR(24),
    duplicate_reason    VARCHAR(255),
    -- Set for a row that duplicates an earlier row of the same file.
    duplicate_of_row    INT,

    -- The patient this row produced. Its presence is what makes a retry safe:
    -- a row that already has one is never imported again.
    patient_id          BIGINT,
    imported_at         DATETIME(6),

    PRIMARY KEY (id),
    CONSTRAINT fk_patient_import_row_job FOREIGN KEY (job_id) REFERENCES patient_import_job(id) ON DELETE CASCADE,
    -- One staged row per spreadsheet line: re-running analysis cannot duplicate them.
    CONSTRAINT uq_patient_import_row UNIQUE (job_id, source_row),
    -- The import pass walks a job's rows by status in row order.
    INDEX ix_patient_import_row_job_status (job_id, status, source_row),
    -- The within-file duplicate passes group on these.
    INDEX ix_patient_import_row_phone (job_id, dedup_phone),
    INDEX ix_patient_import_row_external (job_id, dedup_external_id),
    INDEX ix_patient_import_row_name (job_id, dedup_name_key, dedup_dob)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;


-- A patient's external identifier is what a migrating clinic matches on, and the
-- duplicate pass looks it up per tenant. V14 indexed external_mrn alone; this
-- makes the lookup tenant-local, which is how every import query asks for it.
CREATE INDEX ix_patient_org_external_mrn ON patient (organization_id, external_mrn);
-- The same for the two other duplicate keys.
CREATE INDEX ix_patient_org_phone_digits ON patient (organization_id, phone_digits);
CREATE INDEX ix_patient_org_name_dob     ON patient (organization_id, full_name, date_of_birth);


-- Importing a clinic's whole patient list is a different and far more dangerous
-- act than registering one patient, so it gets its own permission rather than
-- riding on PATIENT_WRITE.
INSERT INTO permission (name, description, created_at, updated_at, created_by, updated_by) VALUES
 ('PATIENT_IMPORT','Bulk import patient records from a spreadsheet',NOW(6),NOW(6),'system','system');

-- Grants are not retroactive (see V70's note): SUPER_ADMIN and LAB_ADMINISTRATOR
-- need this spelled out even though V2 granted them everything that existed then.
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM role r JOIN permission p
WHERE p.name = 'PATIENT_IMPORT'
  AND r.name IN ('SUPER_ADMIN', 'LAB_ADMINISTRATOR');
