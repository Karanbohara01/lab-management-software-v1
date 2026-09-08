-- ---------------------------------------------------------------------------
-- V10  IRD / e-billing (CBMS) submission tracking.
--
--      This stores ONLY our own integration metadata, kept separate from the
--      invoice. It does NOT represent an official IRD registration and the
--      system transmits nothing until a verified gateway is configured.
-- ---------------------------------------------------------------------------

CREATE TABLE ird_submission (
    id                  BIGINT       NOT NULL AUTO_INCREMENT,
    invoice_id          BIGINT       NOT NULL,
    status              VARCHAR(24)  NOT NULL,
    provider_reference  VARCHAR(120) NULL,
    last_error_code     VARCHAR(64)  NULL,
    last_error_message  VARCHAR(500) NULL,
    attempt_count       INT          NOT NULL DEFAULT 0,
    manual              TINYINT(1)   NOT NULL DEFAULT 0,
    manual_reference    VARCHAR(120) NULL,
    notes               VARCHAR(1000) NULL,
    submitted_at        DATETIME(6)  NULL,
    accepted_at         DATETIME(6)  NULL,
    cancelled_at        DATETIME(6)  NULL,
    version             BIGINT       NOT NULL DEFAULT 0,
    created_at          DATETIME(6)  NOT NULL,
    updated_at          DATETIME(6)  NOT NULL,
    created_by          VARCHAR(100) NULL,
    updated_by          VARCHAR(100) NULL,
    PRIMARY KEY (id),
    CONSTRAINT uq_ird_submission_invoice UNIQUE (invoice_id),
    CONSTRAINT fk_ird_submission_invoice FOREIGN KEY (invoice_id) REFERENCES invoice (id),
    INDEX ix_ird_submission_status (status)
) ENGINE = InnoDB;

CREATE TABLE ird_submission_attempt (
    id                  BIGINT       NOT NULL AUTO_INCREMENT,
    submission_id       BIGINT       NOT NULL,
    attempt_no          INT          NOT NULL,
    action              VARCHAR(24)  NOT NULL,
    request_status      VARCHAR(24)  NOT NULL,
    response_status     VARCHAR(24)  NULL,
    provider_reference  VARCHAR(120) NULL,
    error_code          VARCHAR(64)  NULL,
    error_message       VARCHAR(500) NULL,
    actor               VARCHAR(100) NOT NULL,
    occurred_at         DATETIME(6)  NOT NULL,
    request_snapshot    JSON         NULL,
    response_snapshot   JSON         NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_ird_attempt_submission FOREIGN KEY (submission_id)
        REFERENCES ird_submission (id) ON DELETE CASCADE,
    INDEX ix_ird_attempt_submission (submission_id, occurred_at)
) ENGINE = InnoDB;
