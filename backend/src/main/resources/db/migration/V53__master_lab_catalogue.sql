-- Platform-wide master lab test catalogue — curated centrally by a platform admin, browsable and
-- importable by every clinic (see np.com.lims.platform.MasterCatalogService). Deliberately NOT
-- tenant-owned (no organization_id column) — same pattern as `organization`/`subscription_plan`.
-- Importing copies these values onto a brand-new, independently-owned LabTest/TestParameter/
-- ReferenceRange tree for that clinic (never a live link back here), same "copy-once" philosophy
-- as ParameterMaster.

CREATE TABLE master_lab_test (
    id                  BIGINT       NOT NULL AUTO_INCREMENT,
    code                VARCHAR(32)  NOT NULL,
    name                VARCHAR(160) NOT NULL,
    department_name     VARCHAR(120) NOT NULL,
    category            VARCHAR(80)  NULL,
    specimen_type       VARCHAR(32)  NOT NULL,
    suggested_price     DECIMAL(12,2) NOT NULL DEFAULT 0,
    turnaround_hours    INT          NULL,
    display_order       INT          NOT NULL DEFAULT 0,
    active              TINYINT(1)   NOT NULL DEFAULT 1,
    version             BIGINT       NOT NULL DEFAULT 0,
    created_at          DATETIME(6)  NOT NULL,
    updated_at          DATETIME(6)  NOT NULL,
    created_by          VARCHAR(100) NULL,
    updated_by          VARCHAR(100) NULL,
    PRIMARY KEY (id),
    CONSTRAINT uq_master_lab_test_code UNIQUE (code)
) ENGINE = InnoDB;

CREATE TABLE master_test_parameter (
    id                  BIGINT       NOT NULL AUTO_INCREMENT,
    master_lab_test_id  BIGINT       NOT NULL,
    code                VARCHAR(32)  NULL,
    name                VARCHAR(160) NOT NULL,
    unit                VARCHAR(32)  NULL,
    data_type           VARCHAR(32)  NOT NULL DEFAULT 'NUMERIC',
    display_order       INT          NOT NULL DEFAULT 0,
    decimal_places      INT          NULL,
    group_heading       VARCHAR(120) NULL,
    version             BIGINT       NOT NULL DEFAULT 0,
    created_at          DATETIME(6)  NOT NULL,
    updated_at          DATETIME(6)  NOT NULL,
    created_by          VARCHAR(100) NULL,
    updated_by          VARCHAR(100) NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_master_test_parameter_test FOREIGN KEY (master_lab_test_id) REFERENCES master_lab_test(id) ON DELETE CASCADE,
    INDEX idx_master_test_parameter_test (master_lab_test_id)
) ENGINE = InnoDB;

CREATE TABLE master_reference_range (
    id                      BIGINT       NOT NULL AUTO_INCREMENT,
    master_test_parameter_id BIGINT     NOT NULL,
    applies_to_gender       VARCHAR(16)  NOT NULL DEFAULT 'ALL',
    low_value               DECIMAL(16,4) NULL,
    high_value              DECIMAL(16,4) NULL,
    critical_low            DECIMAL(16,4) NULL,
    critical_high           DECIMAL(16,4) NULL,
    normal_text             VARCHAR(200) NULL,
    version                 BIGINT       NOT NULL DEFAULT 0,
    created_at              DATETIME(6)  NOT NULL,
    updated_at              DATETIME(6)  NOT NULL,
    created_by              VARCHAR(100) NULL,
    updated_by              VARCHAR(100) NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_master_reference_range_param FOREIGN KEY (master_test_parameter_id) REFERENCES master_test_parameter(id) ON DELETE CASCADE,
    INDEX idx_master_reference_range_param (master_test_parameter_id)
) ENGINE = InnoDB;

-- ===== seed: 6 common tests, real reference ranges (same values already used by
-- np.com.lims.catalog.DefaultParameterPresets / V48, kept consistent) ===================

SET @now = UTC_TIMESTAMP(6);

-- Complete Blood Count (CBC) — Hematology
INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('CBC', 'Complete Blood Count', 'Hematology', 'Hematology', 'BLOOD_EDTA', 500.00, 4, 1, @now, @now);
SET @cbc = LAST_INSERT_ID();

INSERT INTO master_test_parameter (master_lab_test_id, code, name, unit, data_type, display_order, decimal_places, group_heading, created_at, updated_at) VALUES
(@cbc, 'HGB', 'Haemoglobin', 'g/dL', 'NUMERIC', 1, 1, NULL, @now, @now),
(@cbc, 'HCT', 'Haematocrit', '%', 'NUMERIC', 2, 1, NULL, @now, @now),
(@cbc, 'RBC', 'RBC Count', 'x10⁶/µL', 'NUMERIC', 3, 2, NULL, @now, @now),
(@cbc, 'WBC', 'WBC Count', 'x10³/µL', 'NUMERIC', 4, 1, NULL, @now, @now),
(@cbc, 'PLT', 'Platelet Count', 'x10³/µL', 'NUMERIC', 5, NULL, NULL, @now, @now),
(@cbc, 'MCV', 'MCV', 'fL', 'NUMERIC', 6, 1, NULL, @now, @now),
(@cbc, 'MCH', 'MCH', 'pg', 'NUMERIC', 7, 1, NULL, @now, @now),
(@cbc, 'MCHC', 'MCHC', 'g/dL', 'NUMERIC', 8, 1, NULL, @now, @now),
(@cbc, 'RDW', 'RDW', '%', 'NUMERIC', 9, 1, NULL, @now, @now),
(@cbc, 'NEUT', 'Neutrophils', '%', 'NUMERIC', 10, 1, 'Differential count', @now, @now),
(@cbc, 'LYMPH', 'Lymphocytes', '%', 'NUMERIC', 11, 1, 'Differential count', @now, @now),
(@cbc, 'MONO', 'Monocytes', '%', 'NUMERIC', 12, 1, 'Differential count', @now, @now),
(@cbc, 'EO', 'Eosinophils', '%', 'NUMERIC', 13, 1, 'Differential count', @now, @now),
(@cbc, 'BASO', 'Basophils', '%', 'NUMERIC', 14, 1, 'Differential count', @now, @now);

INSERT INTO master_reference_range (master_test_parameter_id, low_value, high_value, critical_low, critical_high, created_at, updated_at)
SELECT id, v.lo, v.hi, v.cl, v.ch, @now, @now FROM master_test_parameter p
JOIN (VALUES
    ROW('HGB', 12.0, 17.0, 7.0, 20.0), ROW('HCT', 36.0, 50.0, NULL, NULL), ROW('RBC', 4.5, 5.9, NULL, NULL),
    ROW('WBC', 4.0, 11.0, 1.0, 30.0), ROW('PLT', 150.0, 450.0, 20.0, 1000.0), ROW('MCV', 80.0, 100.0, NULL, NULL),
    ROW('MCH', 27.0, 33.0, NULL, NULL), ROW('MCHC', 32.0, 36.0, NULL, NULL), ROW('RDW', 11.5, 14.5, NULL, NULL),
    ROW('NEUT', 40.0, 75.0, NULL, NULL), ROW('LYMPH', 20.0, 45.0, NULL, NULL), ROW('MONO', 2.0, 10.0, NULL, NULL),
    ROW('EO', 1.0, 6.0, NULL, NULL), ROW('BASO', 0.0, 1.0, NULL, NULL)
) AS v(code, lo, hi, cl, ch) ON v.code = p.code
WHERE p.master_lab_test_id = @cbc;

-- Liver Function Test (LFT) — Biochemistry
INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('LFT', 'Liver Function Test', 'Biochemistry', 'Biochemistry', 'BLOOD_SERUM', 700.00, 6, 2, @now, @now);
SET @lft = LAST_INSERT_ID();

INSERT INTO master_test_parameter (master_lab_test_id, code, name, unit, data_type, display_order, decimal_places, created_at, updated_at) VALUES
(@lft, 'TBIL', 'Total Bilirubin', 'mg/dL', 'NUMERIC', 1, 1, @now, @now),
(@lft, 'DBIL', 'Direct Bilirubin', 'mg/dL', 'NUMERIC', 2, 2, @now, @now),
(@lft, 'ALT', 'SGPT (ALT)', 'U/L', 'NUMERIC', 3, NULL, @now, @now),
(@lft, 'AST', 'SGOT (AST)', 'U/L', 'NUMERIC', 4, NULL, @now, @now),
(@lft, 'ALP', 'Alkaline Phosphatase', 'U/L', 'NUMERIC', 5, NULL, @now, @now),
(@lft, 'GGT', 'GGT', 'U/L', 'NUMERIC', 6, NULL, @now, @now),
(@lft, 'TP', 'Total Protein', 'g/dL', 'NUMERIC', 7, 1, @now, @now),
(@lft, 'ALB', 'Albumin', 'g/dL', 'NUMERIC', 8, 1, @now, @now);

INSERT INTO master_reference_range (master_test_parameter_id, low_value, high_value, created_at, updated_at)
SELECT id, v.lo, v.hi, @now, @now FROM master_test_parameter p
JOIN (VALUES
    ROW('TBIL', 0.2, 1.2), ROW('DBIL', 0.0, 0.3), ROW('ALT', 0.0, 41.0), ROW('AST', 0.0, 40.0),
    ROW('ALP', 40.0, 129.0), ROW('GGT', 8.0, 61.0), ROW('TP', 6.4, 8.3), ROW('ALB', 3.5, 5.2)
) AS v(code, lo, hi) ON v.code = p.code
WHERE p.master_lab_test_id = @lft;

-- Renal Function Test (RFT) — Biochemistry
INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('RFT', 'Renal Function Test', 'Biochemistry', 'Biochemistry', 'BLOOD_SERUM', 700.00, 6, 3, @now, @now);
SET @rft = LAST_INSERT_ID();

INSERT INTO master_test_parameter (master_lab_test_id, code, name, unit, data_type, display_order, decimal_places, created_at, updated_at) VALUES
(@rft, 'UREA', 'Blood Urea', 'mg/dL', 'NUMERIC', 1, NULL, @now, @now),
(@rft, 'CREA', 'Creatinine', 'mg/dL', 'NUMERIC', 2, 2, @now, @now),
(@rft, 'UA', 'Uric Acid', 'mg/dL', 'NUMERIC', 3, 1, @now, @now),
(@rft, 'NA', 'Sodium', 'mmol/L', 'NUMERIC', 4, NULL, @now, @now),
(@rft, 'K', 'Potassium', 'mmol/L', 'NUMERIC', 5, 1, @now, @now),
(@rft, 'CL', 'Chloride', 'mmol/L', 'NUMERIC', 6, NULL, @now, @now);

INSERT INTO master_reference_range (master_test_parameter_id, low_value, high_value, critical_low, critical_high, created_at, updated_at)
SELECT id, v.lo, v.hi, v.cl, v.ch, @now, @now FROM master_test_parameter p
JOIN (VALUES
    ROW('UREA', 15.0, 40.0, NULL, NULL), ROW('CREA', 0.6, 1.3, NULL, 6.0), ROW('UA', 3.5, 7.2, NULL, NULL),
    ROW('NA', 135.0, 145.0, 120.0, 160.0), ROW('K', 3.5, 5.1, 2.5, 6.5), ROW('CL', 98.0, 107.0, NULL, NULL)
) AS v(code, lo, hi, cl, ch) ON v.code = p.code
WHERE p.master_lab_test_id = @rft;

-- Lipid Profile — Biochemistry
INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('LIPID', 'Lipid Profile', 'Biochemistry', 'Biochemistry', 'BLOOD_SERUM', 800.00, 6, 4, @now, @now);
SET @lipid = LAST_INSERT_ID();

INSERT INTO master_test_parameter (master_lab_test_id, code, name, unit, data_type, display_order, created_at, updated_at) VALUES
(@lipid, 'TC', 'Total Cholesterol', 'mg/dL', 'NUMERIC', 1, @now, @now),
(@lipid, 'HDL', 'HDL Cholesterol', 'mg/dL', 'NUMERIC', 2, @now, @now),
(@lipid, 'LDL', 'LDL Cholesterol', 'mg/dL', 'NUMERIC', 3, @now, @now),
(@lipid, 'TG', 'Triglycerides', 'mg/dL', 'NUMERIC', 4, @now, @now),
(@lipid, 'VLDL', 'VLDL Cholesterol', 'mg/dL', 'NUMERIC', 5, @now, @now);

INSERT INTO master_reference_range (master_test_parameter_id, low_value, high_value, created_at, updated_at)
SELECT id, v.lo, v.hi, @now, @now FROM master_test_parameter p
JOIN (VALUES
    ROW('TC', NULL, 200.0), ROW('HDL', 40.0, 60.0), ROW('LDL', NULL, 100.0), ROW('TG', NULL, 150.0), ROW('VLDL', NULL, 30.0)
) AS v(code, lo, hi) ON v.code = p.code
WHERE p.master_lab_test_id = @lipid;

-- Thyroid Profile (T3/T4/TSH) — Biochemistry
INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('THYROID', 'Thyroid Profile (T3, T4, TSH)', 'Biochemistry', 'Endocrinology', 'BLOOD_SERUM', 900.00, 8, 5, @now, @now);
SET @thy = LAST_INSERT_ID();

INSERT INTO master_test_parameter (master_lab_test_id, code, name, unit, data_type, display_order, decimal_places, created_at, updated_at) VALUES
(@thy, 'TSH', 'TSH', 'µIU/mL', 'NUMERIC', 1, 2, @now, @now),
(@thy, 'FT4', 'Free T4', 'ng/dL', 'NUMERIC', 2, 2, @now, @now),
(@thy, 'FT3', 'Free T3', 'pg/mL', 'NUMERIC', 3, 1, @now, @now);

INSERT INTO master_reference_range (master_test_parameter_id, low_value, high_value, created_at, updated_at)
SELECT id, v.lo, v.hi, @now, @now FROM master_test_parameter p
JOIN (VALUES ROW('TSH', 0.4, 4.0), ROW('FT4', 0.8, 1.8), ROW('FT3', 2.3, 4.2)) AS v(code, lo, hi) ON v.code = p.code
WHERE p.master_lab_test_id = @thy;

-- Blood Sugar Fasting & PP — Biochemistry
INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('BSUGAR', 'Blood Sugar (Fasting & PP)', 'Biochemistry', 'Biochemistry', 'BLOOD_FLUORIDE', 300.00, 2, 6, @now, @now);
SET @bs = LAST_INSERT_ID();

INSERT INTO master_test_parameter (master_lab_test_id, code, name, unit, data_type, display_order, created_at, updated_at) VALUES
(@bs, 'GLU-F', 'Glucose Fasting', 'mg/dL', 'NUMERIC', 1, @now, @now),
(@bs, 'GLU-PP', 'Glucose PP (2h)', 'mg/dL', 'NUMERIC', 2, @now, @now);

INSERT INTO master_reference_range (master_test_parameter_id, low_value, high_value, critical_low, critical_high, created_at, updated_at)
SELECT id, v.lo, v.hi, v.cl, v.ch, @now, @now FROM master_test_parameter p
JOIN (VALUES ROW('GLU-F', 70.0, 100.0, 40.0, 450.0), ROW('GLU-PP', 70.0, 140.0, NULL, NULL)) AS v(code, lo, hi, cl, ch) ON v.code = p.code
WHERE p.master_lab_test_id = @bs;
