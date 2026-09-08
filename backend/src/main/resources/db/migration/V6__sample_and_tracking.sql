-- ---------------------------------------------------------------------------
-- V6  Samples, the tests they carry, and an append-only tracking timeline.
-- ---------------------------------------------------------------------------

INSERT INTO app_sequence (name, next_value) VALUES ('ACCESSION_NUMBER', 1);

CREATE TABLE sample (
    id                 BIGINT       NOT NULL AUTO_INCREMENT,
    accession_number   VARCHAR(24)  NOT NULL,
    barcode_value      VARCHAR(48)  NOT NULL,
    lab_order_id       BIGINT       NOT NULL,
    patient_id         BIGINT       NOT NULL,
    specimen_type      VARCHAR(32)  NOT NULL,
    status             VARCHAR(32)  NOT NULL,
    container          VARCHAR(120) NULL,
    collection_site    VARCHAR(160) NULL,
    notes              VARCHAR(500) NULL,
    collected_at       DATETIME(6)  NULL,
    collected_by       VARCHAR(100) NULL,
    received_at        DATETIME(6)  NULL,
    received_by        VARCHAR(100) NULL,
    rejected_at        DATETIME(6)  NULL,
    rejected_by        VARCHAR(100) NULL,
    rejection_reason   VARCHAR(500) NULL,
    version            BIGINT       NOT NULL DEFAULT 0,
    created_at         DATETIME(6)  NOT NULL,
    updated_at         DATETIME(6)  NOT NULL,
    created_by         VARCHAR(100) NULL,
    updated_by         VARCHAR(100) NULL,
    PRIMARY KEY (id),
    CONSTRAINT uq_sample_accession UNIQUE (accession_number),
    CONSTRAINT uq_sample_barcode UNIQUE (barcode_value),
    CONSTRAINT fk_sample_order   FOREIGN KEY (lab_order_id) REFERENCES lab_order (id),
    CONSTRAINT fk_sample_patient FOREIGN KEY (patient_id)   REFERENCES patient (id),
    INDEX ix_sample_status (status),
    INDEX ix_sample_order (lab_order_id),
    INDEX ix_sample_patient (patient_id),
    INDEX ix_sample_created_at (created_at)
) ENGINE = InnoDB;

CREATE TABLE sample_item (
    id                  BIGINT       NOT NULL AUTO_INCREMENT,
    sample_id           BIGINT       NOT NULL,
    lab_order_item_id   BIGINT       NOT NULL,
    lab_test_id         BIGINT       NOT NULL,
    test_code           VARCHAR(32)  NOT NULL,
    test_name           VARCHAR(160) NOT NULL,
    department_id       BIGINT       NOT NULL,
    department_name     VARCHAR(120) NOT NULL,
    version             BIGINT       NOT NULL DEFAULT 0,
    created_at          DATETIME(6)  NOT NULL,
    updated_at          DATETIME(6)  NOT NULL,
    created_by          VARCHAR(100) NULL,
    updated_by          VARCHAR(100) NULL,
    PRIMARY KEY (id),
    CONSTRAINT uq_sample_item_order_item UNIQUE (lab_order_item_id),
    CONSTRAINT fk_sample_item_sample     FOREIGN KEY (sample_id) REFERENCES sample (id) ON DELETE CASCADE,
    CONSTRAINT fk_sample_item_order_item FOREIGN KEY (lab_order_item_id) REFERENCES lab_order_item (id),
    CONSTRAINT fk_sample_item_test       FOREIGN KEY (lab_test_id) REFERENCES lab_test (id),
    INDEX ix_sample_item_sample (sample_id),
    INDEX ix_sample_item_department (department_id)
) ENGINE = InnoDB;

CREATE TABLE sample_event (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    sample_id     BIGINT       NOT NULL,
    event_type    VARCHAR(32)  NOT NULL,
    from_status   VARCHAR(32)  NULL,
    to_status     VARCHAR(32)  NULL,
    actor         VARCHAR(100) NOT NULL,
    note          VARCHAR(500) NULL,
    occurred_at   DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_sample_event_sample FOREIGN KEY (sample_id) REFERENCES sample (id) ON DELETE CASCADE,
    INDEX ix_sample_event_sample (sample_id, occurred_at)
) ENGINE = InnoDB;
