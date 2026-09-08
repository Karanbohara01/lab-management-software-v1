-- ---------------------------------------------------------------------------
-- V16  Patient identity documents (national ID, passport, PAN, insurance …)
--      and the billing party (payer) captured at registration.
-- ---------------------------------------------------------------------------

CREATE TABLE patient_identifier (
    id           BIGINT       NOT NULL AUTO_INCREMENT,
    patient_id   BIGINT       NOT NULL,
    id_type      VARCHAR(32)  NOT NULL,
    id_value     VARCHAR(60)  NOT NULL,
    issued_place VARCHAR(120) NULL,
    issued_date  DATE         NULL,
    is_primary   TINYINT(1)   NOT NULL DEFAULT 0,
    note         VARCHAR(200) NULL,
    version      BIGINT       NOT NULL DEFAULT 0,
    created_at   DATETIME(6)  NOT NULL,
    updated_at   DATETIME(6)  NOT NULL,
    created_by   VARCHAR(100) NULL,
    updated_by   VARCHAR(100) NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_patient_identifier_patient FOREIGN KEY (patient_id) REFERENCES patient (id),
    INDEX ix_patient_identifier_patient (patient_id),
    INDEX ix_patient_identifier_lookup (id_type, id_value)
) ENGINE = InnoDB;

ALTER TABLE patient
    ADD COLUMN payer_type          VARCHAR(20)  NOT NULL DEFAULT 'SELF',
    ADD COLUMN payer_name          VARCHAR(160) NULL,
    ADD COLUMN payer_scheme        VARCHAR(120) NULL,
    ADD COLUMN payer_member_id     VARCHAR(60)  NULL,
    ADD COLUMN payer_authorization VARCHAR(60)  NULL,
    ADD COLUMN payer_valid_until   DATE         NULL,
    ADD COLUMN payer_note          VARCHAR(300) NULL;
