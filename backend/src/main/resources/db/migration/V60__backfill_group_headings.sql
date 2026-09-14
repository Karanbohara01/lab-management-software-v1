-- Backfills group_heading (sub-section labels within a printed test's parameter table — see
-- V59/np.com.lims.report.entity.ReportParameter) across every clinic's EXISTING parameter_master
-- dictionary rows, test_parameter rows, AND the platform master_test_parameter catalogue —
-- wherever it is currently NULL. Never overwrites a value a clinic already set (WHERE
-- group_heading IS NULL everywhere), so any clinic that already customised its own grouping keeps
-- exactly what it had. Matches DefaultParameterPresets.java's scheme, which now seeds these same
-- groupings for any NEW organization going forward — this migration is purely for organizations
-- that already existed before that Java change.

SET @now = UTC_TIMESTAMP(6);

-- Reusable mapping: analyte name (case-insensitive) -> group heading.
-- (Applied three times below — parameter_master, test_parameter, master_test_parameter — since
-- MySQL has no session-scoped temp view usable across statements without CREATE TEMPORARY TABLE.)
CREATE TEMPORARY TABLE _group_heading_map (
    param_name VARCHAR(160) NOT NULL,
    heading VARCHAR(120) NOT NULL,
    PRIMARY KEY (param_name)
);

INSERT INTO _group_heading_map (param_name, heading) VALUES
    ('Haemoglobin', 'Erythrocytes'), ('Haematocrit', 'Erythrocytes'), ('RBC Count', 'Erythrocytes'),
    ('WBC Count', 'Leucocytes'), ('Platelet Count', 'Platelets'), ('MPV', 'Platelets'),
    ('MCV', 'RBC Indices'), ('MCH', 'RBC Indices'), ('MCHC', 'RBC Indices'), ('RDW', 'RBC Indices'), ('RDW-CV', 'RBC Indices'),
    ('Neutrophils', 'Differential Leukocyte Count'), ('Lymphocytes', 'Differential Leukocyte Count'),
    ('Monocytes', 'Differential Leukocyte Count'), ('Eosinophils', 'Differential Leukocyte Count'),
    ('Basophils', 'Differential Leukocyte Count'),
    ('Absolute Neutrophil Count', 'Absolute Leukocyte Counts'), ('Absolute Lymphocyte Count', 'Absolute Leukocyte Counts'),
    ('Absolute Monocyte Count', 'Absolute Leukocyte Counts'), ('Absolute Eosinophil Count', 'Absolute Leukocyte Counts'),
    ('Absolute Basophil Count', 'Absolute Leukocyte Counts'),
    ('Blood Urea', 'Renal Function'), ('BUN', 'Renal Function'), ('Creatinine', 'Renal Function'),
    ('Uric Acid', 'Renal Function'), ('eGFR', 'Renal Function'),
    ('Sodium', 'Electrolytes'), ('Potassium', 'Electrolytes'), ('Chloride', 'Electrolytes'), ('Bicarbonate', 'Electrolytes'),
    ('Calcium', 'Minerals'), ('Calcium Total', 'Minerals'), ('Phosphorus', 'Minerals'), ('Magnesium', 'Minerals'),
    ('Total Bilirubin', 'Bilirubin'), ('Direct Bilirubin', 'Bilirubin'), ('Indirect Bilirubin', 'Bilirubin'),
    ('SGPT (ALT)', 'Liver Enzymes'), ('SGOT (AST)', 'Liver Enzymes'), ('Alkaline Phosphatase', 'Liver Enzymes'), ('GGT', 'Liver Enzymes'),
    ('Total Protein', 'Proteins'), ('Albumin', 'Proteins'), ('Globulin', 'Proteins'), ('A:G Ratio', 'Proteins');

UPDATE parameter_master pm
JOIN _group_heading_map m ON LOWER(pm.name) = LOWER(m.param_name)
SET pm.group_heading = m.heading, pm.updated_at = @now
WHERE pm.group_heading IS NULL;

UPDATE test_parameter tp
JOIN _group_heading_map m ON LOWER(tp.name) = LOWER(m.param_name)
SET tp.group_heading = m.heading, tp.updated_at = @now
WHERE tp.group_heading IS NULL;

UPDATE master_test_parameter mtp
JOIN _group_heading_map m ON LOWER(mtp.name) = LOWER(m.param_name)
SET mtp.group_heading = m.heading, mtp.updated_at = @now
WHERE mtp.group_heading IS NULL;

DROP TEMPORARY TABLE _group_heading_map;
