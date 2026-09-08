-- ---------------------------------------------------------------------------
-- V22  Internal quality control: QC materials & lots, assigned target
--      mean/SD per parameter, QC runs with Westgard-rule evaluation, and a
--      lockout flag so patient results aren't approved while QC is rejected.
-- ---------------------------------------------------------------------------

CREATE TABLE qc_material (
    id           BIGINT       NOT NULL AUTO_INCREMENT,
    name         VARCHAR(120) NOT NULL,
    manufacturer VARCHAR(120) NULL,
    lot_number   VARCHAR(60)  NULL,
    level        VARCHAR(20)  NOT NULL DEFAULT 'LEVEL_1',
    lab_test_id  BIGINT       NOT NULL,
    expiry_date  DATE         NULL,
    note         VARCHAR(300) NULL,
    active       TINYINT(1)   NOT NULL DEFAULT 1,
    version      BIGINT       NOT NULL DEFAULT 0,
    created_at   DATETIME(6)  NOT NULL,
    updated_at   DATETIME(6)  NOT NULL,
    created_by   VARCHAR(100) NULL,
    updated_by   VARCHAR(100) NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_qc_material_test FOREIGN KEY (lab_test_id) REFERENCES lab_test (id),
    INDEX ix_qc_material_test (lab_test_id)
) ENGINE = InnoDB;

CREATE TABLE qc_target (
    id                BIGINT        NOT NULL AUTO_INCREMENT,
    qc_material_id    BIGINT        NOT NULL,
    test_parameter_id BIGINT        NOT NULL,
    target_mean       DECIMAL(16,4) NOT NULL,
    target_sd         DECIMAL(16,4) NOT NULL,
    unit              VARCHAR(20)   NULL,
    source            VARCHAR(20)   NOT NULL DEFAULT 'ASSIGNED',
    version           BIGINT        NOT NULL DEFAULT 0,
    created_at        DATETIME(6)   NOT NULL,
    updated_at        DATETIME(6)   NOT NULL,
    created_by        VARCHAR(100)  NULL,
    updated_by        VARCHAR(100)  NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_qc_target_material  FOREIGN KEY (qc_material_id)    REFERENCES qc_material (id),
    CONSTRAINT fk_qc_target_parameter FOREIGN KEY (test_parameter_id) REFERENCES test_parameter (id),
    CONSTRAINT uq_qc_target UNIQUE (qc_material_id, test_parameter_id),
    INDEX ix_qc_target_material (qc_material_id)
) ENGINE = InnoDB;

CREATE TABLE qc_run (
    id                BIGINT        NOT NULL AUTO_INCREMENT,
    qc_material_id    BIGINT        NOT NULL,
    test_parameter_id BIGINT        NOT NULL,
    lab_test_id       BIGINT        NOT NULL,
    value             DECIMAL(16,4) NOT NULL,
    target_mean       DECIMAL(16,4) NOT NULL,
    target_sd         DECIMAL(16,4) NOT NULL,
    z_score           DECIMAL(8,3)  NULL,
    status            VARCHAR(12)   NOT NULL,
    violated_rules    VARCHAR(200)  NULL,
    analyzer          VARCHAR(80)   NULL,
    shift             VARCHAR(20)   NULL,
    operator          VARCHAR(100)  NULL,
    accepted          TINYINT(1)    NOT NULL DEFAULT 0,
    comment           VARCHAR(300)  NULL,
    run_at            DATETIME(6)   NOT NULL,
    version           BIGINT        NOT NULL DEFAULT 0,
    created_at        DATETIME(6)   NOT NULL,
    updated_at        DATETIME(6)   NOT NULL,
    created_by        VARCHAR(100)  NULL,
    updated_by        VARCHAR(100)  NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_qc_run_material  FOREIGN KEY (qc_material_id)    REFERENCES qc_material (id),
    CONSTRAINT fk_qc_run_parameter FOREIGN KEY (test_parameter_id) REFERENCES test_parameter (id),
    CONSTRAINT fk_qc_run_test      FOREIGN KEY (lab_test_id)       REFERENCES lab_test (id),
    INDEX ix_qc_run_series (qc_material_id, test_parameter_id, run_at),
    INDEX ix_qc_run_test (lab_test_id, run_at)
) ENGINE = InnoDB;
