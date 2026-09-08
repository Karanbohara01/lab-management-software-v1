-- ---------------------------------------------------------------------------
-- V3  Referring doctors, patients, and the application sequence counter.
-- ---------------------------------------------------------------------------

CREATE TABLE app_sequence (
    name        VARCHAR(64) NOT NULL,
    next_value  BIGINT      NOT NULL DEFAULT 1,
    PRIMARY KEY (name)
) ENGINE = InnoDB;

INSERT INTO app_sequence (name, next_value) VALUES ('PATIENT_MRN', 1);

CREATE TABLE doctor (
    id                      BIGINT       NOT NULL AUTO_INCREMENT,
    full_name               VARCHAR(160) NOT NULL,
    specialization          VARCHAR(120) NULL,
    qualification           VARCHAR(160) NULL,
    nmc_number              VARCHAR(40)  NULL,
    phone                   VARCHAR(32)  NULL,
    email                   VARCHAR(160) NULL,
    affiliated_organization VARCHAR(200) NULL,
    active                  TINYINT(1)   NOT NULL DEFAULT 1,
    version                 BIGINT       NOT NULL DEFAULT 0,
    created_at              DATETIME(6)  NOT NULL,
    updated_at              DATETIME(6)  NOT NULL,
    created_by              VARCHAR(100) NULL,
    updated_by              VARCHAR(100) NULL,
    PRIMARY KEY (id),
    CONSTRAINT uq_doctor_nmc UNIQUE (nmc_number),
    INDEX ix_doctor_full_name (full_name),
    INDEX ix_doctor_active (active)
) ENGINE = InnoDB;

CREATE TABLE patient (
    id                   BIGINT       NOT NULL AUTO_INCREMENT,
    mrn                  VARCHAR(24)  NOT NULL,
    full_name            VARCHAR(160) NOT NULL,
    gender               VARCHAR(16)  NOT NULL,
    date_of_birth        DATE         NULL,
    approximate_age_years INT         NULL,
    phone                VARCHAR(32)  NULL,
    email                VARCHAR(160) NULL,
    address_line         VARCHAR(200) NULL,
    city                 VARCHAR(100) NULL,
    district             VARCHAR(100) NULL,
    province             VARCHAR(100) NULL,
    referring_doctor_id  BIGINT       NULL,
    notes                VARCHAR(1000) NULL,
    active               TINYINT(1)   NOT NULL DEFAULT 1,
    version              BIGINT       NOT NULL DEFAULT 0,
    created_at           DATETIME(6)  NOT NULL,
    updated_at           DATETIME(6)  NOT NULL,
    created_by           VARCHAR(100) NULL,
    updated_by           VARCHAR(100) NULL,
    PRIMARY KEY (id),
    CONSTRAINT uq_patient_mrn UNIQUE (mrn),
    CONSTRAINT fk_patient_doctor FOREIGN KEY (referring_doctor_id) REFERENCES doctor (id),
    INDEX ix_patient_full_name (full_name),
    INDEX ix_patient_phone (phone),
    INDEX ix_patient_created_at (created_at)
) ENGINE = InnoDB;
