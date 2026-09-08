-- ---------------------------------------------------------------------------
-- V8  Laboratory profile (report letterhead) and generated reports.
-- ---------------------------------------------------------------------------

INSERT INTO app_sequence (name, next_value) VALUES ('REPORT_NUMBER', 1);

CREATE TABLE laboratory_profile (
    id             BIGINT        NOT NULL,
    name           VARCHAR(200)  NOT NULL,
    address_line   VARCHAR(300)  NULL,
    city           VARCHAR(120)  NULL,
    phone          VARCHAR(64)   NULL,
    email          VARCHAR(160)  NULL,
    pan_number     VARCHAR(40)   NULL,
    report_footer  VARCHAR(1000) NULL,
    logo_data_uri  MEDIUMTEXT    NULL,
    version        BIGINT        NOT NULL DEFAULT 0,
    created_at     DATETIME(6)   NOT NULL,
    updated_at     DATETIME(6)   NOT NULL,
    created_by     VARCHAR(100)  NULL,
    updated_by     VARCHAR(100)  NULL,
    PRIMARY KEY (id)
) ENGINE = InnoDB;

INSERT INTO laboratory_profile (id, name, address_line, city, report_footer, created_at, updated_at, created_by, updated_by)
VALUES (1, 'Your Laboratory Name', 'Street address', 'Kathmandu',
        'This report is generated electronically. Results relate only to the sample tested. Clinical correlation is advised.',
        NOW(6), NOW(6), 'system', 'system');

CREATE TABLE report (
    id                    BIGINT       NOT NULL AUTO_INCREMENT,
    report_number         VARCHAR(24)  NOT NULL,
    lab_order_id          BIGINT       NOT NULL,
    patient_id            BIGINT       NOT NULL,
    referring_doctor_name VARCHAR(160) NULL,
    status                VARCHAR(24)  NOT NULL,
    report_version        INT          NOT NULL DEFAULT 1,
    generated_at          DATETIME(6)  NOT NULL,
    generated_by          VARCHAR(100) NOT NULL,
    released_at           DATETIME(6)  NULL,
    released_by           VARCHAR(100) NULL,
    delivered_at          DATETIME(6)  NULL,
    delivered_by          VARCHAR(100) NULL,
    delivery_method       VARCHAR(32)  NULL,
    delivery_recipient    VARCHAR(200) NULL,
    version               BIGINT       NOT NULL DEFAULT 0,
    created_at            DATETIME(6)  NOT NULL,
    updated_at            DATETIME(6)  NOT NULL,
    created_by            VARCHAR(100) NULL,
    updated_by            VARCHAR(100) NULL,
    PRIMARY KEY (id),
    CONSTRAINT uq_report_order  UNIQUE (lab_order_id),
    CONSTRAINT uq_report_number UNIQUE (report_number),
    CONSTRAINT fk_report_order   FOREIGN KEY (lab_order_id) REFERENCES lab_order (id),
    CONSTRAINT fk_report_patient FOREIGN KEY (patient_id)   REFERENCES patient (id),
    INDEX ix_report_status (status),
    INDEX ix_report_patient (patient_id)
) ENGINE = InnoDB;

CREATE TABLE report_test (
    id               BIGINT       NOT NULL AUTO_INCREMENT,
    report_id        BIGINT       NOT NULL,
    test_code        VARCHAR(32)  NOT NULL,
    test_name        VARCHAR(160) NOT NULL,
    department_name  VARCHAR(120) NOT NULL,
    method           VARCHAR(120) NULL,
    specimen         VARCHAR(48)  NULL,
    accession_number VARCHAR(24)  NULL,
    comment          VARCHAR(2000) NULL,
    verified_by      VARCHAR(100) NULL,
    approved_by      VARCHAR(100) NULL,
    approved_at      DATETIME(6)  NULL,
    display_order    INT          NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    CONSTRAINT fk_report_test_report FOREIGN KEY (report_id) REFERENCES report (id) ON DELETE CASCADE,
    INDEX ix_report_test_report (report_id, display_order)
) ENGINE = InnoDB;

CREATE TABLE report_parameter (
    id              BIGINT        NOT NULL AUTO_INCREMENT,
    report_test_id  BIGINT        NOT NULL,
    name            VARCHAR(160)  NOT NULL,
    unit            VARCHAR(32)   NULL,
    value_display   VARCHAR(500)  NULL,
    flag            VARCHAR(16)   NOT NULL DEFAULT 'NONE',
    reference_text  VARCHAR(160)  NULL,
    display_order   INT           NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    CONSTRAINT fk_report_parameter_test FOREIGN KEY (report_test_id) REFERENCES report_test (id) ON DELETE CASCADE,
    INDEX ix_report_parameter_test (report_test_id, display_order)
) ENGINE = InnoDB;
