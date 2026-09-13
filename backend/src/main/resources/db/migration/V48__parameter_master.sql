-- A clinic's own reusable analyte dictionary, picked from when adding a parameter to a test (see
-- ParameterMaster's javadoc) — replaces the previous hardcoded, non-editable frontend preset list
-- with a real, per-clinic-editable one.
CREATE TABLE parameter_master (
    id                BIGINT       NOT NULL AUTO_INCREMENT,
    organization_id   BIGINT       NOT NULL,
    name              VARCHAR(160) NOT NULL,
    code              VARCHAR(32)  NULL,
    unit              VARCHAR(32)  NULL,
    data_type         VARCHAR(32)  NOT NULL DEFAULT 'NUMERIC',
    decimal_places    INT          NULL,
    method            VARCHAR(120) NULL,
    loinc_code        VARCHAR(20)  NULL,
    group_heading     VARCHAR(120) NULL,
    allowed_values    VARCHAR(500) NULL,
    low_value         DECIMAL(14,4) NULL,
    high_value        DECIMAL(14,4) NULL,
    critical_low      DECIMAL(14,4) NULL,
    critical_high     DECIMAL(14,4) NULL,
    active            TINYINT(1)   NOT NULL DEFAULT 1,
    version           BIGINT       NOT NULL DEFAULT 0,
    created_at        DATETIME(6)  NOT NULL,
    updated_at        DATETIME(6)  NOT NULL,
    created_by        VARCHAR(100) NULL,
    updated_by        VARCHAR(100) NULL,
    PRIMARY KEY (id),
    CONSTRAINT uq_parameter_master_org_name UNIQUE (organization_id, name),
    CONSTRAINT fk_parameter_master_org FOREIGN KEY (organization_id) REFERENCES organization(id)
) ENGINE = InnoDB;

-- Seed every EXISTING organization with the same ~55 common-analyte defaults the frontend used to
-- hardcode (unit + typical adult reference range only — not a substitute for the lab's own
-- method-specific validation, same caveat the old frontend list carried). New organizations
-- onboarded after this migration start with an empty dictionary and build their own over time —
-- a deliberate simplification, not an oversight (see PlatformService's provisioning; extending it
-- to also seed this table is a reasonable fast-follow, not required for this feature to work).
INSERT INTO parameter_master
    (organization_id, name, code, unit, data_type, decimal_places, low_value, high_value, critical_low, critical_high, group_heading, created_at, updated_at, created_by, updated_by)
SELECT o.id, v.name, v.code, v.unit, 'NUMERIC', v.decimal_places, v.low_value, v.high_value, v.critical_low, v.critical_high, v.group_heading, NOW(6), NOW(6), 'system', 'system'
FROM organization o
CROSS JOIN (
    SELECT 'Haemoglobin' name, 'HGB' code, 'g/dL' unit, 1 decimal_places, 12 low_value, 17 high_value, 7 critical_low, 20 critical_high, NULL group_heading UNION ALL
    SELECT 'Haematocrit', 'HCT', '%', 1, 36, 50, NULL, NULL, NULL UNION ALL
    SELECT 'RBC Count', 'RBC', 'x10⁶/µL', 2, 4.5, 5.9, NULL, NULL, NULL UNION ALL
    SELECT 'WBC Count', 'WBC', 'x10³/µL', 1, 4, 11, 1, 30, NULL UNION ALL
    SELECT 'Platelet Count', 'PLT', 'x10³/µL', NULL, 150, 450, 20, 1000, NULL UNION ALL
    SELECT 'MCV', 'MCV', 'fL', 1, 80, 100, NULL, NULL, NULL UNION ALL
    SELECT 'MCH', 'MCH', 'pg', 1, 27, 33, NULL, NULL, NULL UNION ALL
    SELECT 'MCHC', 'MCHC', 'g/dL', 1, 32, 36, NULL, NULL, NULL UNION ALL
    SELECT 'RDW', 'RDW', '%', 1, 11.5, 14.5, NULL, NULL, NULL UNION ALL
    SELECT 'Neutrophils', 'NEUT', '%', 1, 40, 75, NULL, NULL, 'Differential count' UNION ALL
    SELECT 'Lymphocytes', 'LYMPH', '%', 1, 20, 45, NULL, NULL, 'Differential count' UNION ALL
    SELECT 'Monocytes', 'MONO', '%', 1, 2, 10, NULL, NULL, 'Differential count' UNION ALL
    SELECT 'Eosinophils', 'EO', '%', 1, 1, 6, NULL, NULL, 'Differential count' UNION ALL
    SELECT 'Basophils', 'BASO', '%', 1, 0, 1, NULL, NULL, 'Differential count' UNION ALL
    SELECT 'ESR', 'ESR', 'mm/hr', NULL, 0, 20, NULL, NULL, NULL UNION ALL
    SELECT 'Glucose Fasting', 'GLU-F', 'mg/dL', NULL, 70, 100, 40, 450, NULL UNION ALL
    SELECT 'Glucose Random', 'GLU-R', 'mg/dL', NULL, 70, 140, 40, 450, NULL UNION ALL
    SELECT 'Glucose PP (2h)', 'GLU-PP', 'mg/dL', NULL, 70, 140, NULL, NULL, NULL UNION ALL
    SELECT 'HbA1c', 'HBA1C', '%', 1, 4, 5.6, NULL, NULL, NULL UNION ALL
    SELECT 'Blood Urea', 'UREA', 'mg/dL', NULL, 15, 40, NULL, NULL, NULL UNION ALL
    SELECT 'Creatinine', 'CREA', 'mg/dL', 2, 0.6, 1.3, NULL, 6, NULL UNION ALL
    SELECT 'Uric Acid', 'UA', 'mg/dL', 1, 3.5, 7.2, NULL, NULL, NULL UNION ALL
    SELECT 'eGFR', 'EGFR', 'mL/min/1.73m²', NULL, 90, 120, NULL, NULL, NULL UNION ALL
    SELECT 'Sodium', 'NA', 'mmol/L', NULL, 135, 145, 120, 160, NULL UNION ALL
    SELECT 'Potassium', 'K', 'mmol/L', 1, 3.5, 5.1, 2.5, 6.5, NULL UNION ALL
    SELECT 'Chloride', 'CL', 'mmol/L', NULL, 98, 107, NULL, NULL, NULL UNION ALL
    SELECT 'Bicarbonate', 'HCO3', 'mmol/L', NULL, 22, 29, NULL, NULL, NULL UNION ALL
    SELECT 'Calcium', 'CA', 'mg/dL', 1, 8.6, 10.2, 6, 13, NULL UNION ALL
    SELECT 'Phosphorus', 'PHOS', 'mg/dL', 1, 2.5, 4.5, NULL, NULL, NULL UNION ALL
    SELECT 'Magnesium', 'MG', 'mg/dL', 1, 1.7, 2.2, NULL, NULL, NULL UNION ALL
    SELECT 'Total Bilirubin', 'TBIL', 'mg/dL', 1, 0.2, 1.2, NULL, NULL, NULL UNION ALL
    SELECT 'Direct Bilirubin', 'DBIL', 'mg/dL', 2, 0, 0.3, NULL, NULL, NULL UNION ALL
    SELECT 'SGPT (ALT)', 'ALT', 'U/L', NULL, 0, 41, NULL, NULL, NULL UNION ALL
    SELECT 'SGOT (AST)', 'AST', 'U/L', NULL, 0, 40, NULL, NULL, NULL UNION ALL
    SELECT 'Alkaline Phosphatase', 'ALP', 'U/L', NULL, 40, 129, NULL, NULL, NULL UNION ALL
    SELECT 'GGT', 'GGT', 'U/L', NULL, 8, 61, NULL, NULL, NULL UNION ALL
    SELECT 'Total Protein', 'TP', 'g/dL', 1, 6.4, 8.3, NULL, NULL, NULL UNION ALL
    SELECT 'Albumin', 'ALB', 'g/dL', 1, 3.5, 5.2, NULL, NULL, NULL UNION ALL
    SELECT 'Total Cholesterol', 'TC', 'mg/dL', NULL, NULL, 200, NULL, NULL, NULL UNION ALL
    SELECT 'HDL Cholesterol', 'HDL', 'mg/dL', NULL, 40, 60, NULL, NULL, NULL UNION ALL
    SELECT 'LDL Cholesterol', 'LDL', 'mg/dL', NULL, NULL, 100, NULL, NULL, NULL UNION ALL
    SELECT 'Triglycerides', 'TG', 'mg/dL', NULL, NULL, 150, NULL, NULL, NULL UNION ALL
    SELECT 'VLDL Cholesterol', 'VLDL', 'mg/dL', NULL, NULL, 30, NULL, NULL, NULL UNION ALL
    SELECT 'TSH', 'TSH', 'µIU/mL', 2, 0.4, 4, NULL, NULL, NULL UNION ALL
    SELECT 'Free T4', 'FT4', 'ng/dL', 2, 0.8, 1.8, NULL, NULL, NULL UNION ALL
    SELECT 'Free T3', 'FT3', 'pg/mL', 1, 2.3, 4.2, NULL, NULL, NULL UNION ALL
    SELECT 'Vitamin D (25-OH)', 'VITD', 'ng/mL', NULL, 30, 100, NULL, NULL, NULL UNION ALL
    SELECT 'Vitamin B12', 'B12', 'pg/mL', NULL, 200, 900, NULL, NULL, NULL UNION ALL
    SELECT 'Ferritin', 'FERR', 'ng/mL', NULL, 30, 300, NULL, NULL, NULL UNION ALL
    SELECT 'CRP', 'CRP', 'mg/L', NULL, NULL, 5, NULL, NULL, NULL UNION ALL
    SELECT 'PSA Total', 'PSA', 'ng/mL', 2, NULL, 4, NULL, NULL, NULL
) v;
