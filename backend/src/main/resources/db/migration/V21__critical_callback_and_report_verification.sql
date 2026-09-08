-- ---------------------------------------------------------------------------
-- V21  Critical-value read-back callback log (ISO 15189), preliminary /
--      partial reports, and signed, independently-verifiable reports.
-- ---------------------------------------------------------------------------

ALTER TABLE test_result
    ADD COLUMN critical_ack_required TINYINT(1) NOT NULL DEFAULT 0;

CREATE INDEX ix_test_result_critical_ack ON test_result (critical_ack_required);

CREATE TABLE critical_value_callback (
    id                  BIGINT       NOT NULL AUTO_INCREMENT,
    test_result_id      BIGINT       NOT NULL,
    notified_name       VARCHAR(120) NULL,
    notified_role       VARCHAR(60)  NULL,
    contact_method      VARCHAR(20)  NOT NULL,
    read_back_confirmed TINYINT(1)   NOT NULL DEFAULT 0,
    remarks             VARCHAR(500) NULL,
    waived              TINYINT(1)   NOT NULL DEFAULT 0,
    waived_reason       VARCHAR(300) NULL,
    notified_at         DATETIME(6)  NOT NULL,
    version             BIGINT       NOT NULL DEFAULT 0,
    created_at          DATETIME(6)  NOT NULL,
    updated_at          DATETIME(6)  NOT NULL,
    created_by          VARCHAR(100) NULL,
    updated_by          VARCHAR(100) NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_cvc_result FOREIGN KEY (test_result_id) REFERENCES test_result (id),
    INDEX ix_cvc_result (test_result_id)
) ENGINE = InnoDB;

ALTER TABLE report
    ADD COLUMN report_type        VARCHAR(16)  NOT NULL DEFAULT 'FINAL',
    ADD COLUMN verification_token VARCHAR(40)  NULL,
    ADD COLUMN content_hash       VARCHAR(64)  NULL,
    ADD COLUMN signed_by          VARCHAR(120) NULL,
    ADD COLUMN signer_credentials VARCHAR(120) NULL,
    ADD COLUMN signed_at          DATETIME(6)  NULL;

CREATE UNIQUE INDEX ux_report_verification_token ON report (verification_token);
