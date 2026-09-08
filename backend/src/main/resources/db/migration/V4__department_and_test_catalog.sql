-- ---------------------------------------------------------------------------
-- V4  Departments and the configurable test catalog (tests, parameters, ranges).
-- ---------------------------------------------------------------------------

CREATE TABLE department (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    code        VARCHAR(24)  NOT NULL,
    name        VARCHAR(120) NOT NULL,
    description VARCHAR(500) NULL,
    active      TINYINT(1)   NOT NULL DEFAULT 1,
    version     BIGINT       NOT NULL DEFAULT 0,
    created_at  DATETIME(6)  NOT NULL,
    updated_at  DATETIME(6)  NOT NULL,
    created_by  VARCHAR(100) NULL,
    updated_by  VARCHAR(100) NULL,
    PRIMARY KEY (id),
    CONSTRAINT uq_department_code UNIQUE (code)
) ENGINE = InnoDB;

CREATE TABLE lab_test (
    id                     BIGINT        NOT NULL AUTO_INCREMENT,
    code                   VARCHAR(32)   NOT NULL,
    name                   VARCHAR(160)  NOT NULL,
    department_id          BIGINT        NOT NULL,
    category               VARCHAR(80)   NULL,
    specimen_type          VARCHAR(32)   NOT NULL,
    specimen_requirements  VARCHAR(500)  NULL,
    method                 VARCHAR(120)  NULL,
    price                  DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    turnaround_hours       INT           NULL,
    active                 TINYINT(1)    NOT NULL DEFAULT 1,
    version                BIGINT        NOT NULL DEFAULT 0,
    created_at             DATETIME(6)   NOT NULL,
    updated_at             DATETIME(6)   NOT NULL,
    created_by             VARCHAR(100)  NULL,
    updated_by             VARCHAR(100)  NULL,
    PRIMARY KEY (id),
    CONSTRAINT uq_lab_test_code UNIQUE (code),
    CONSTRAINT fk_lab_test_department FOREIGN KEY (department_id) REFERENCES department (id),
    CONSTRAINT ck_lab_test_price CHECK (price >= 0),
    INDEX ix_lab_test_name (name),
    INDEX ix_lab_test_active (active)
) ENGINE = InnoDB;

CREATE TABLE test_parameter (
    id             BIGINT       NOT NULL AUTO_INCREMENT,
    lab_test_id    BIGINT       NOT NULL,
    code           VARCHAR(32)  NULL,
    name           VARCHAR(160) NOT NULL,
    unit           VARCHAR(32)  NULL,
    data_type      VARCHAR(32)  NOT NULL,
    display_order  INT          NOT NULL DEFAULT 0,
    version        BIGINT       NOT NULL DEFAULT 0,
    created_at     DATETIME(6)  NOT NULL,
    updated_at     DATETIME(6)  NOT NULL,
    created_by     VARCHAR(100) NULL,
    updated_by     VARCHAR(100) NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_test_parameter_test FOREIGN KEY (lab_test_id) REFERENCES lab_test (id) ON DELETE CASCADE,
    INDEX ix_test_parameter_test (lab_test_id, display_order)
) ENGINE = InnoDB;

CREATE TABLE reference_range (
    id                BIGINT        NOT NULL AUTO_INCREMENT,
    test_parameter_id BIGINT        NOT NULL,
    applies_to_gender VARCHAR(16)   NOT NULL DEFAULT 'ALL',
    age_min_years     INT           NULL,
    age_max_years     INT           NULL,
    low_value         DECIMAL(14,4) NULL,
    high_value        DECIMAL(14,4) NULL,
    normal_text       VARCHAR(120)  NULL,
    critical_low      DECIMAL(14,4) NULL,
    critical_high     DECIMAL(14,4) NULL,
    version           BIGINT        NOT NULL DEFAULT 0,
    created_at        DATETIME(6)   NOT NULL,
    updated_at        DATETIME(6)   NOT NULL,
    created_by        VARCHAR(100)  NULL,
    updated_by        VARCHAR(100)  NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_reference_range_parameter FOREIGN KEY (test_parameter_id)
        REFERENCES test_parameter (id) ON DELETE CASCADE,
    INDEX ix_reference_range_parameter (test_parameter_id)
) ENGINE = InnoDB;
