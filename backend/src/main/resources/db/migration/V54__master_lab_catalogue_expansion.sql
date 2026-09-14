-- Expands the platform master lab catalogue (V53) with the full standard test menu of a
-- general pathology lab in Nepal — hematology, coagulation, biochemistry, endocrinology,
-- serology/immunology, clinical pathology and microbiology. Reference ranges are the
-- conventional adult ranges used across standard lab reference texts (Harrison's / CLSI-style
-- conventional units), consistent with the values already seeded in V53 and
-- np.com.lims.catalog.DefaultParameterPresets. Parameters carry display_order + group_heading
-- so an imported test's result/report layout reads in the same section order as a real
-- printed lab report (e.g. Urine Routine: Physical -> Chemical -> Microscopic).

SET @now = UTC_TIMESTAMP(6);

-- ===================================================================================
-- HEMATOLOGY
-- ===================================================================================

-- Erythrocyte Sedimentation Rate (ESR)
INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('ESR', 'Erythrocyte Sedimentation Rate (ESR)', 'Hematology', 'Hematology', 'BLOOD_CITRATE', 150.00, 2, 7, @now, @now);
SET @esr = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, unit, data_type, display_order, created_at, updated_at) VALUES
(@esr, 'ESR', 'ESR (Westergren)', 'mm/hr', 'NUMERIC', 1, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, applies_to_gender, low_value, high_value, created_at, updated_at)
SELECT id, 'MALE', 0.0, 15.0, @now, @now FROM master_test_parameter WHERE master_lab_test_id = @esr AND code = 'ESR';
INSERT INTO master_reference_range (master_test_parameter_id, applies_to_gender, low_value, high_value, created_at, updated_at)
SELECT id, 'FEMALE', 0.0, 20.0, @now, @now FROM master_test_parameter WHERE master_lab_test_id = @esr AND code = 'ESR';

-- Reticulocyte Count
INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('RETIC', 'Reticulocyte Count', 'Hematology', 'Hematology', 'BLOOD_EDTA', 350.00, 4, 8, @now, @now);
SET @ret = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, unit, data_type, display_order, decimal_places, created_at, updated_at) VALUES
(@ret, 'RETIC', 'Reticulocyte Count', '%', 'NUMERIC', 1, 1, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, low_value, high_value, created_at, updated_at)
SELECT id, 0.5, 2.5, @now, @now FROM master_test_parameter WHERE master_lab_test_id = @ret AND code = 'RETIC';

-- Peripheral Blood Smear (PBS)
INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('PBS', 'Peripheral Blood Smear Examination', 'Hematology', 'Hematology', 'BLOOD_EDTA', 300.00, 4, 9, @now, @now);
SET @pbs = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, data_type, display_order, group_heading, created_at, updated_at) VALUES
(@pbs, 'RBC-MORPH', 'RBC Morphology', 'TEXT', 1, NULL, @now, @now),
(@pbs, 'WBC-MORPH', 'WBC Morphology', 'TEXT', 2, NULL, @now, @now),
(@pbs, 'PLT-MORPH', 'Platelet Morphology', 'TEXT', 3, NULL, @now, @now),
(@pbs, 'HAEMOPARASITE', 'Haemoparasites', 'TEXT', 4, NULL, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, normal_text, created_at, updated_at)
SELECT id, v.txt, @now, @now FROM master_test_parameter p
JOIN (VALUES
    ROW('RBC-MORPH', 'Normocytic normochromic'), ROW('WBC-MORPH', 'Normal in number and morphology'),
    ROW('PLT-MORPH', 'Adequate in number, normal morphology'), ROW('HAEMOPARASITE', 'Not seen')
) AS v(code, txt) ON v.code = p.code WHERE p.master_lab_test_id = @pbs;

-- Blood Grouping & Rh Typing
INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('BGRP', 'Blood Grouping & Rh Typing', 'Hematology', 'Immunohematology', 'WHOLE_BLOOD', 200.00, 1, 10, @now, @now);
SET @bg = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, data_type, display_order, created_at, updated_at) VALUES
(@bg, 'ABO', 'ABO Blood Group', 'TEXT', 1, @now, @now),
(@bg, 'RH', 'Rh (D) Type', 'TEXT', 2, @now, @now);

-- ===================================================================================
-- COAGULATION
-- ===================================================================================

-- Prothrombin Time / INR
INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('PTINR', 'Prothrombin Time (PT) / INR', 'Coagulation', 'Coagulation', 'BLOOD_CITRATE', 400.00, 3, 11, @now, @now);
SET @pt = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, unit, data_type, display_order, decimal_places, created_at, updated_at) VALUES
(@pt, 'PT', 'Prothrombin Time', 'sec', 'NUMERIC', 1, 1, @now, @now),
(@pt, 'PT-CTRL', 'Control (Mean Normal PT)', 'sec', 'NUMERIC', 2, 1, @now, @now),
(@pt, 'INR', 'INR', NULL, 'NUMERIC', 3, 2, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, low_value, high_value, created_at, updated_at)
SELECT id, v.lo, v.hi, @now, @now FROM master_test_parameter p
JOIN (VALUES ROW('PT', 11.0, 13.5), ROW('PT-CTRL', 11.0, 13.5), ROW('INR', 0.8, 1.2)) AS v(code, lo, hi) ON v.code = p.code
WHERE p.master_lab_test_id = @pt;

-- Activated Partial Thromboplastin Time (APTT)
INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('APTT', 'Activated Partial Thromboplastin Time (APTT)', 'Coagulation', 'Coagulation', 'BLOOD_CITRATE', 400.00, 3, 12, @now, @now);
SET @aptt = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, unit, data_type, display_order, decimal_places, created_at, updated_at) VALUES
(@aptt, 'APTT', 'APTT', 'sec', 'NUMERIC', 1, 1, @now, @now),
(@aptt, 'APTT-CTRL', 'Control (Mean Normal APTT)', 'sec', 'NUMERIC', 2, 1, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, low_value, high_value, created_at, updated_at)
SELECT id, 25.0, 35.0, @now, @now FROM master_test_parameter WHERE master_lab_test_id = @aptt AND code IN ('APTT', 'APTT-CTRL');

-- Bleeding Time & Clotting Time
INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('BTCT', 'Bleeding Time & Clotting Time', 'Coagulation', 'Coagulation', 'WHOLE_BLOOD', 200.00, 1, 13, @now, @now);
SET @btct = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, unit, data_type, display_order, created_at, updated_at) VALUES
(@btct, 'BT', 'Bleeding Time', 'min', 'NUMERIC', 1, @now, @now),
(@btct, 'CT', 'Clotting Time', 'min', 'NUMERIC', 2, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, low_value, high_value, created_at, updated_at)
SELECT id, v.lo, v.hi, @now, @now FROM master_test_parameter p
JOIN (VALUES ROW('BT', 2.0, 7.0), ROW('CT', 5.0, 10.0)) AS v(code, lo, hi) ON v.code = p.code
WHERE p.master_lab_test_id = @btct;

-- ===================================================================================
-- BIOCHEMISTRY
-- ===================================================================================

-- Random Blood Sugar
INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('RBS', 'Random Blood Sugar', 'Biochemistry', 'Biochemistry', 'BLOOD_FLUORIDE', 150.00, 1, 14, @now, @now);
SET @rbs = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, unit, data_type, display_order, created_at, updated_at) VALUES
(@rbs, 'GLU-R', 'Glucose Random', 'mg/dL', 'NUMERIC', 1, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, low_value, high_value, critical_low, critical_high, created_at, updated_at)
SELECT id, 70.0, 140.0, 40.0, 450.0, @now, @now FROM master_test_parameter WHERE master_lab_test_id = @rbs AND code = 'GLU-R';

-- Oral Glucose Tolerance Test (OGTT)
INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('OGTT', 'Oral Glucose Tolerance Test (OGTT)', 'Biochemistry', 'Biochemistry', 'BLOOD_FLUORIDE', 600.00, 3, 15, @now, @now);
SET @ogtt = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, unit, data_type, display_order, created_at, updated_at) VALUES
(@ogtt, 'GLU-0', 'Fasting (0 hr)', 'mg/dL', 'NUMERIC', 1, @now, @now),
(@ogtt, 'GLU-1', '1 Hour', 'mg/dL', 'NUMERIC', 2, @now, @now),
(@ogtt, 'GLU-2', '2 Hour', 'mg/dL', 'NUMERIC', 3, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, low_value, high_value, created_at, updated_at)
SELECT id, v.lo, v.hi, @now, @now FROM master_test_parameter p
JOIN (VALUES ROW('GLU-0', 70.0, 100.0), ROW('GLU-1', NULL, 180.0), ROW('GLU-2', 70.0, 140.0)) AS v(code, lo, hi) ON v.code = p.code
WHERE p.master_lab_test_id = @ogtt;

-- HbA1c
INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('HBA1C', 'Glycated Haemoglobin (HbA1c)', 'Biochemistry', 'Biochemistry', 'BLOOD_EDTA', 900.00, 6, 16, @now, @now);
SET @a1c = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, unit, data_type, display_order, decimal_places, created_at, updated_at) VALUES
(@a1c, 'HBA1C', 'HbA1c', '%', 'NUMERIC', 1, 1, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, low_value, high_value, created_at, updated_at)
SELECT id, 4.0, 5.6, @now, @now FROM master_test_parameter WHERE master_lab_test_id = @a1c AND code = 'HBA1C';

-- Serum Electrolytes
INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('ELECT', 'Serum Electrolytes (Na, K, Cl, HCO3)', 'Biochemistry', 'Biochemistry', 'BLOOD_SERUM', 600.00, 4, 17, @now, @now);
SET @el = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, unit, data_type, display_order, decimal_places, created_at, updated_at) VALUES
(@el, 'NA', 'Sodium', 'mmol/L', 'NUMERIC', 1, NULL, @now, @now),
(@el, 'K', 'Potassium', 'mmol/L', 'NUMERIC', 2, 1, @now, @now),
(@el, 'CL', 'Chloride', 'mmol/L', 'NUMERIC', 3, NULL, @now, @now),
(@el, 'HCO3', 'Bicarbonate', 'mmol/L', 'NUMERIC', 4, NULL, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, low_value, high_value, critical_low, critical_high, created_at, updated_at)
SELECT id, v.lo, v.hi, v.cl, v.ch, @now, @now FROM master_test_parameter p
JOIN (VALUES
    ROW('NA', 135.0, 145.0, 120.0, 160.0), ROW('K', 3.5, 5.1, 2.5, 6.5),
    ROW('CL', 98.0, 107.0, NULL, NULL), ROW('HCO3', 22.0, 29.0, NULL, NULL)
) AS v(code, lo, hi, cl, ch) ON v.code = p.code
WHERE p.master_lab_test_id = @el;

-- Serum Calcium, Phosphorus, Magnesium
INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('CAPMG', 'Serum Calcium, Phosphorus & Magnesium', 'Biochemistry', 'Biochemistry', 'BLOOD_SERUM', 700.00, 6, 18, @now, @now);
SET @capmg = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, unit, data_type, display_order, decimal_places, created_at, updated_at) VALUES
(@capmg, 'CA', 'Calcium', 'mg/dL', 'NUMERIC', 1, 1, @now, @now),
(@capmg, 'PHOS', 'Phosphorus', 'mg/dL', 'NUMERIC', 2, 1, @now, @now),
(@capmg, 'MG', 'Magnesium', 'mg/dL', 'NUMERIC', 3, 1, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, low_value, high_value, created_at, updated_at)
SELECT id, v.lo, v.hi, @now, @now FROM master_test_parameter p
JOIN (VALUES ROW('CA', 8.5, 10.5), ROW('PHOS', 2.5, 4.5), ROW('MG', 1.7, 2.2)) AS v(code, lo, hi) ON v.code = p.code
WHERE p.master_lab_test_id = @capmg;

-- Serum Amylase & Lipase
INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('AMYLIP', 'Serum Amylase & Lipase', 'Biochemistry', 'Biochemistry', 'BLOOD_SERUM', 800.00, 6, 19, @now, @now);
SET @al = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, unit, data_type, display_order, created_at, updated_at) VALUES
(@al, 'AMYL', 'Amylase', 'U/L', 'NUMERIC', 1, @now, @now),
(@al, 'LIP', 'Lipase', 'U/L', 'NUMERIC', 2, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, low_value, high_value, created_at, updated_at)
SELECT id, v.lo, v.hi, @now, @now FROM master_test_parameter p
JOIN (VALUES ROW('AMYL', 28.0, 100.0), ROW('LIP', 13.0, 60.0)) AS v(code, lo, hi) ON v.code = p.code
WHERE p.master_lab_test_id = @al;

-- Serum Uric Acid (standalone)
INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('URICAC', 'Serum Uric Acid', 'Biochemistry', 'Biochemistry', 'BLOOD_SERUM', 300.00, 4, 20, @now, @now);
SET @ua = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, unit, data_type, display_order, decimal_places, created_at, updated_at) VALUES
(@ua, 'UA', 'Uric Acid', 'mg/dL', 'NUMERIC', 1, 1, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, applies_to_gender, low_value, high_value, created_at, updated_at)
SELECT id, 'MALE', 3.4, 7.2, @now, @now FROM master_test_parameter WHERE master_lab_test_id = @ua AND code = 'UA';
INSERT INTO master_reference_range (master_test_parameter_id, applies_to_gender, low_value, high_value, created_at, updated_at)
SELECT id, 'FEMALE', 2.4, 6.0, @now, @now FROM master_test_parameter WHERE master_lab_test_id = @ua AND code = 'UA';

-- Iron Studies
INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('IRONST', 'Iron Studies (Iron, TIBC, Transferrin Saturation, Ferritin)', 'Biochemistry', 'Biochemistry', 'BLOOD_SERUM', 1500.00, 24, 21, @now, @now);
SET @iron = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, unit, data_type, display_order, decimal_places, created_at, updated_at) VALUES
(@iron, 'FE', 'Serum Iron', 'µg/dL', 'NUMERIC', 1, NULL, @now, @now),
(@iron, 'TIBC', 'TIBC', 'µg/dL', 'NUMERIC', 2, NULL, @now, @now),
(@iron, 'TSAT', 'Transferrin Saturation', '%', 'NUMERIC', 3, 1, @now, @now),
(@iron, 'FERR', 'Ferritin', 'ng/mL', 'NUMERIC', 4, 1, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, low_value, high_value, created_at, updated_at)
SELECT id, v.lo, v.hi, @now, @now FROM master_test_parameter p
JOIN (VALUES ROW('FE', 60.0, 170.0), ROW('TIBC', 240.0, 450.0), ROW('TSAT', 20.0, 50.0)) AS v(code, lo, hi) ON v.code = p.code
WHERE p.master_lab_test_id = @iron;
INSERT INTO master_reference_range (master_test_parameter_id, applies_to_gender, low_value, high_value, created_at, updated_at)
SELECT id, 'MALE', 20.0, 250.0, @now, @now FROM master_test_parameter WHERE master_lab_test_id = @iron AND code = 'FERR';
INSERT INTO master_reference_range (master_test_parameter_id, applies_to_gender, low_value, high_value, created_at, updated_at)
SELECT id, 'FEMALE', 10.0, 120.0, @now, @now FROM master_test_parameter WHERE master_lab_test_id = @iron AND code = 'FERR';

-- Vitamin D (25-OH)
INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('VITD', 'Vitamin D (25-OH)', 'Endocrinology', 'Endocrinology', 'BLOOD_SERUM', 2200.00, 24, 22, @now, @now);
SET @vd = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, unit, data_type, display_order, decimal_places, created_at, updated_at) VALUES
(@vd, 'VITD', 'Vitamin D (25-Hydroxy)', 'ng/mL', 'NUMERIC', 1, 1, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, low_value, high_value, normal_text, created_at, updated_at)
SELECT id, 30.0, 100.0, 'Deficient: <20, Insufficient: 20-29.9, Sufficient: 30-100', @now, @now FROM master_test_parameter WHERE master_lab_test_id = @vd AND code = 'VITD';

-- Vitamin B12
INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('VITB12', 'Vitamin B12', 'Endocrinology', 'Endocrinology', 'BLOOD_SERUM', 1800.00, 24, 23, @now, @now);
SET @b12 = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, unit, data_type, display_order, created_at, updated_at) VALUES
(@b12, 'B12', 'Vitamin B12', 'pg/mL', 'NUMERIC', 1, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, low_value, high_value, created_at, updated_at)
SELECT id, 200.0, 900.0, @now, @now FROM master_test_parameter WHERE master_lab_test_id = @b12 AND code = 'B12';

-- Cardiac Markers
INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('CARDIAC', 'Cardiac Markers (Troponin I, CK-MB)', 'Biochemistry', 'Cardiac Biomarkers', 'BLOOD_SERUM', 2500.00, 3, 24, @now, @now);
SET @card = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, unit, data_type, display_order, decimal_places, created_at, updated_at) VALUES
(@card, 'TROP-I', 'Troponin I', 'ng/mL', 'NUMERIC', 1, 3, @now, @now),
(@card, 'CKMB', 'CK-MB', 'U/L', 'NUMERIC', 2, 1, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, low_value, high_value, created_at, updated_at)
SELECT id, v.lo, v.hi, @now, @now FROM master_test_parameter p
JOIN (VALUES ROW('TROP-I', 0.0, 0.04), ROW('CKMB', 0.0, 25.0)) AS v(code, lo, hi) ON v.code = p.code
WHERE p.master_lab_test_id = @card;

-- Lactate Dehydrogenase (LDH)
INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('LDH', 'Lactate Dehydrogenase (LDH)', 'Biochemistry', 'Biochemistry', 'BLOOD_SERUM', 500.00, 6, 25, @now, @now);
SET @ldh = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, unit, data_type, display_order, created_at, updated_at) VALUES
(@ldh, 'LDH', 'LDH', 'U/L', 'NUMERIC', 1, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, low_value, high_value, created_at, updated_at)
SELECT id, 140.0, 280.0, @now, @now FROM master_test_parameter WHERE master_lab_test_id = @ldh AND code = 'LDH';

-- ===================================================================================
-- ENDOCRINOLOGY (hormones)
-- ===================================================================================

-- Serum Cortisol
INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('CORT', 'Serum Cortisol (Morning)', 'Endocrinology', 'Endocrinology', 'BLOOD_SERUM', 1500.00, 24, 26, @now, @now);
SET @cort = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, unit, data_type, display_order, decimal_places, created_at, updated_at) VALUES
(@cort, 'CORT', 'Cortisol (8 AM)', 'µg/dL', 'NUMERIC', 1, 1, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, low_value, high_value, created_at, updated_at)
SELECT id, 6.0, 23.0, @now, @now FROM master_test_parameter WHERE master_lab_test_id = @cort AND code = 'CORT';

-- Serum Testosterone (Total)
INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('TESTO', 'Serum Testosterone (Total)', 'Endocrinology', 'Endocrinology', 'BLOOD_SERUM', 1800.00, 24, 27, @now, @now);
SET @testo = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, unit, data_type, display_order, created_at, updated_at) VALUES
(@testo, 'TESTO', 'Testosterone Total', 'ng/dL', 'NUMERIC', 1, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, applies_to_gender, low_value, high_value, created_at, updated_at)
SELECT id, 'MALE', 280.0, 1100.0, @now, @now FROM master_test_parameter WHERE master_lab_test_id = @testo AND code = 'TESTO';
INSERT INTO master_reference_range (master_test_parameter_id, applies_to_gender, low_value, high_value, created_at, updated_at)
SELECT id, 'FEMALE', 15.0, 70.0, @now, @now FROM master_test_parameter WHERE master_lab_test_id = @testo AND code = 'TESTO';

-- FSH / LH / Prolactin
INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('FSHLH', 'FSH, LH & Prolactin', 'Endocrinology', 'Endocrinology', 'BLOOD_SERUM', 2400.00, 24, 28, @now, @now);
SET @fsh = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, unit, data_type, display_order, decimal_places, created_at, updated_at) VALUES
(@fsh, 'FSH', 'FSH', 'mIU/mL', 'NUMERIC', 1, 2, @now, @now),
(@fsh, 'LH', 'LH', 'mIU/mL', 'NUMERIC', 2, 2, @now, @now),
(@fsh, 'PRL', 'Prolactin', 'ng/mL', 'NUMERIC', 3, 1, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, normal_text, created_at, updated_at)
SELECT id, 'Reference range is age/sex/menstrual-cycle-phase dependent — see lab insert', @now, @now
FROM master_test_parameter WHERE master_lab_test_id = @fsh;

-- ===================================================================================
-- SEROLOGY & IMMUNOLOGY
-- ===================================================================================

-- C-Reactive Protein (CRP)
INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('CRP', 'C-Reactive Protein (CRP)', 'Serology & Immunology', 'Serology', 'BLOOD_SERUM', 500.00, 3, 29, @now, @now);
SET @crp = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, unit, data_type, display_order, decimal_places, created_at, updated_at) VALUES
(@crp, 'CRP', 'CRP', 'mg/L', 'NUMERIC', 1, 1, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, low_value, high_value, created_at, updated_at)
SELECT id, 0.0, 6.0, @now, @now FROM master_test_parameter WHERE master_lab_test_id = @crp AND code = 'CRP';

-- Rheumatoid Factor (RA)
INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('RAF', 'Rheumatoid Factor (RA Factor)', 'Serology & Immunology', 'Serology', 'BLOOD_SERUM', 500.00, 3, 30, @now, @now);
SET @raf = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, unit, data_type, display_order, decimal_places, created_at, updated_at) VALUES
(@raf, 'RAF', 'RA Factor', 'IU/mL', 'NUMERIC', 1, 1, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, low_value, high_value, created_at, updated_at)
SELECT id, 0.0, 14.0, @now, @now FROM master_test_parameter WHERE master_lab_test_id = @raf AND code = 'RAF';

-- ASO Titre
INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('ASO', 'Anti-Streptolysin O (ASO) Titre', 'Serology & Immunology', 'Serology', 'BLOOD_SERUM', 500.00, 3, 31, @now, @now);
SET @aso = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, unit, data_type, display_order, created_at, updated_at) VALUES
(@aso, 'ASO', 'ASO Titre', 'IU/mL', 'NUMERIC', 1, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, low_value, high_value, created_at, updated_at)
SELECT id, 0.0, 200.0, @now, @now FROM master_test_parameter WHERE master_lab_test_id = @aso AND code = 'ASO';

-- Widal Test (Typhoid)
INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('WIDAL', 'Widal Test (Typhoid Serology)', 'Serology & Immunology', 'Serology', 'BLOOD_SERUM', 400.00, 3, 32, @now, @now);
SET @wid = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, data_type, display_order, created_at, updated_at) VALUES
(@wid, 'TO', 'S. Typhi O (TO)', 'TEXT', 1, @now, @now),
(@wid, 'TH', 'S. Typhi H (TH)', 'TEXT', 2, @now, @now),
(@wid, 'AH', 'S. Paratyphi AH', 'TEXT', 3, @now, @now),
(@wid, 'BH', 'S. Paratyphi BH', 'TEXT', 4, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, normal_text, created_at, updated_at)
SELECT id, 'Titre < 1:80', @now, @now FROM master_test_parameter WHERE master_lab_test_id = @wid;

-- VDRL
INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('VDRL', 'VDRL (Syphilis Screening)', 'Serology & Immunology', 'Serology', 'BLOOD_SERUM', 350.00, 3, 33, @now, @now);
SET @vdrl = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, data_type, display_order, created_at, updated_at) VALUES
(@vdrl, 'VDRL', 'VDRL', 'REACTIVE_NONREACTIVE', 1, @now, @now);

-- HBsAg
INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('HBSAG', 'Hepatitis B Surface Antigen (HBsAg)', 'Serology & Immunology', 'Serology', 'BLOOD_SERUM', 500.00, 3, 34, @now, @now);
SET @hbs = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, data_type, display_order, created_at, updated_at) VALUES
(@hbs, 'HBSAG', 'HBsAg', 'REACTIVE_NONREACTIVE', 1, @now, @now);

-- Anti-HCV
INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('HCV', 'Anti-HCV Antibody', 'Serology & Immunology', 'Serology', 'BLOOD_SERUM', 600.00, 3, 35, @now, @now);
SET @hcv = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, data_type, display_order, created_at, updated_at) VALUES
(@hcv, 'HCV', 'Anti-HCV', 'REACTIVE_NONREACTIVE', 1, @now, @now);

-- HIV I & II Screening
INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('HIV', 'HIV I & II Antibody Screening', 'Serology & Immunology', 'Serology', 'BLOOD_SERUM', 500.00, 3, 36, @now, @now);
SET @hiv = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, data_type, display_order, created_at, updated_at) VALUES
(@hiv, 'HIV', 'HIV I & II Antibody', 'REACTIVE_NONREACTIVE', 1, @now, @now);

-- Dengue Profile
INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('DENGUE', 'Dengue Profile (NS1, IgG, IgM)', 'Serology & Immunology', 'Serology', 'BLOOD_SERUM', 1200.00, 4, 37, @now, @now);
SET @deng = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, data_type, display_order, created_at, updated_at) VALUES
(@deng, 'NS1', 'Dengue NS1 Antigen', 'POSITIVE_NEGATIVE', 1, @now, @now),
(@deng, 'IGM', 'Dengue IgM Antibody', 'POSITIVE_NEGATIVE', 2, @now, @now),
(@deng, 'IGG', 'Dengue IgG Antibody', 'POSITIVE_NEGATIVE', 3, @now, @now);

-- Malaria Antigen (Rapid Test)
INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('MALARIA', 'Malaria Antigen Test (Rapid)', 'Serology & Immunology', 'Serology', 'WHOLE_BLOOD', 500.00, 1, 38, @now, @now);
SET @mal = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, data_type, display_order, created_at, updated_at) VALUES
(@mal, 'PF', 'P. falciparum (HRP-2)', 'POSITIVE_NEGATIVE', 1, @now, @now),
(@mal, 'PV', 'P. vivax (pLDH)', 'POSITIVE_NEGATIVE', 2, @now, @now);

-- Urine Pregnancy Test
INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('UPT', 'Urine Pregnancy Test (Beta-hCG)', 'Serology & Immunology', 'Serology', 'URINE', 150.00, 1, 39, @now, @now);
SET @upt = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, data_type, display_order, created_at, updated_at) VALUES
(@upt, 'HCG', 'Beta-hCG', 'POSITIVE_NEGATIVE', 1, @now, @now);

-- Prostate Specific Antigen (PSA)
INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('PSA', 'Prostate Specific Antigen (PSA Total)', 'Serology & Immunology', 'Tumor Markers', 'BLOOD_SERUM', 1800.00, 24, 40, @now, @now);
SET @psa = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, unit, data_type, display_order, decimal_places, created_at, updated_at) VALUES
(@psa, 'PSA', 'PSA Total', 'ng/mL', 'NUMERIC', 1, 2, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, low_value, high_value, created_at, updated_at)
SELECT id, 0.0, 4.0, @now, @now FROM master_test_parameter WHERE master_lab_test_id = @psa AND code = 'PSA';

-- ===================================================================================
-- CLINICAL PATHOLOGY (Urine / Stool / Semen)
-- ===================================================================================

-- Urine Routine & Microscopic Examination
INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('URE', 'Urine Routine & Microscopic Examination', 'Clinical Pathology', 'Clinical Pathology', 'URINE', 250.00, 2, 41, @now, @now);
SET @ure = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, unit, data_type, display_order, group_heading, created_at, updated_at) VALUES
(@ure, 'U-COL', 'Colour', NULL, 'TEXT', 1, 'Physical Examination', @now, @now),
(@ure, 'U-APP', 'Appearance', NULL, 'TEXT', 2, 'Physical Examination', @now, @now),
(@ure, 'U-SPGR', 'Specific Gravity', NULL, 'NUMERIC', 3, 'Chemical Examination', @now, @now),
(@ure, 'U-PH', 'pH', NULL, 'NUMERIC', 4, 'Chemical Examination', @now, @now),
(@ure, 'U-PROT', 'Protein (Albumin)', NULL, 'TEXT', 5, 'Chemical Examination', @now, @now),
(@ure, 'U-GLU', 'Glucose', NULL, 'TEXT', 6, 'Chemical Examination', @now, @now),
(@ure, 'U-KET', 'Ketones', NULL, 'TEXT', 7, 'Chemical Examination', @now, @now),
(@ure, 'U-BIL', 'Bilirubin', NULL, 'TEXT', 8, 'Chemical Examination', @now, @now),
(@ure, 'U-URO', 'Urobilinogen', 'mg/dL', 'NUMERIC', 9, 'Chemical Examination', @now, @now),
(@ure, 'U-BLD', 'Occult Blood', NULL, 'TEXT', 10, 'Chemical Examination', @now, @now),
(@ure, 'U-NIT', 'Nitrite', NULL, 'TEXT', 11, 'Chemical Examination', @now, @now),
(@ure, 'U-LEU', 'Leukocyte Esterase', NULL, 'TEXT', 12, 'Chemical Examination', @now, @now),
(@ure, 'U-PUS', 'Pus Cells', '/hpf', 'NUMERIC', 13, 'Microscopic Examination', @now, @now),
(@ure, 'U-RBC', 'RBC', '/hpf', 'NUMERIC', 14, 'Microscopic Examination', @now, @now),
(@ure, 'U-EPI', 'Epithelial Cells', '/hpf', 'NUMERIC', 15, 'Microscopic Examination', @now, @now),
(@ure, 'U-CAST', 'Casts', NULL, 'TEXT', 16, 'Microscopic Examination', @now, @now),
(@ure, 'U-CRYS', 'Crystals', NULL, 'TEXT', 17, 'Microscopic Examination', @now, @now),
(@ure, 'U-BACT', 'Bacteria', NULL, 'TEXT', 18, 'Microscopic Examination', @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, low_value, high_value, normal_text, created_at, updated_at)
SELECT id, v.lo, v.hi, v.txt, @now, @now FROM master_test_parameter p
JOIN (VALUES
    ROW('U-COL', NULL, NULL, 'Pale yellow'), ROW('U-APP', NULL, NULL, 'Clear'),
    ROW('U-SPGR', 1.005, 1.030, NULL), ROW('U-PH', 4.5, 8.0, NULL),
    ROW('U-PROT', NULL, NULL, 'Nil / Negative'), ROW('U-GLU', NULL, NULL, 'Nil / Negative'),
    ROW('U-KET', NULL, NULL, 'Nil / Negative'), ROW('U-BIL', NULL, NULL, 'Nil / Negative'),
    ROW('U-URO', 0.2, 1.0, NULL), ROW('U-BLD', NULL, NULL, 'Nil / Negative'),
    ROW('U-NIT', NULL, NULL, 'Negative'), ROW('U-LEU', NULL, NULL, 'Negative'),
    ROW('U-PUS', 0.0, 5.0, NULL), ROW('U-RBC', 0.0, 2.0, NULL),
    ROW('U-EPI', 0.0, 5.0, NULL), ROW('U-CAST', NULL, NULL, 'Nil seen'),
    ROW('U-CRYS', NULL, NULL, 'Nil seen'), ROW('U-BACT', NULL, NULL, 'Nil / Occasional')
) AS v(code, lo, hi, txt) ON v.code = p.code
WHERE p.master_lab_test_id = @ure;

-- Stool Routine & Microscopic Examination
INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('SRE', 'Stool Routine & Microscopic Examination', 'Clinical Pathology', 'Clinical Pathology', 'STOOL', 250.00, 2, 42, @now, @now);
SET @sre = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, unit, data_type, display_order, group_heading, created_at, updated_at) VALUES
(@sre, 'S-COL', 'Colour', NULL, 'TEXT', 1, 'Physical Examination', @now, @now),
(@sre, 'S-CONS', 'Consistency', NULL, 'TEXT', 2, 'Physical Examination', @now, @now),
(@sre, 'S-MUC', 'Mucus', NULL, 'TEXT', 3, 'Physical Examination', @now, @now),
(@sre, 'S-OBLD', 'Occult Blood', NULL, 'TEXT', 4, 'Chemical Examination', @now, @now),
(@sre, 'S-RBC', 'RBC', '/hpf', 'NUMERIC', 5, 'Microscopic Examination', @now, @now),
(@sre, 'S-PUS', 'Pus Cells', '/hpf', 'NUMERIC', 6, 'Microscopic Examination', @now, @now),
(@sre, 'S-OVA', 'Ova / Cyst', NULL, 'TEXT', 7, 'Microscopic Examination', @now, @now),
(@sre, 'S-FAT', 'Fat Globules', NULL, 'TEXT', 8, 'Microscopic Examination', @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, low_value, high_value, normal_text, created_at, updated_at)
SELECT id, v.lo, v.hi, v.txt, @now, @now FROM master_test_parameter p
JOIN (VALUES
    ROW('S-COL', NULL, NULL, 'Brown'), ROW('S-CONS', NULL, NULL, 'Formed / Semi-formed'),
    ROW('S-MUC', NULL, NULL, 'Absent'), ROW('S-OBLD', NULL, NULL, 'Negative'),
    ROW('S-RBC', 0.0, 0.0, NULL), ROW('S-PUS', 0.0, 2.0, NULL),
    ROW('S-OVA', NULL, NULL, 'Not seen'), ROW('S-FAT', NULL, NULL, 'Not seen')
) AS v(code, lo, hi, txt) ON v.code = p.code
WHERE p.master_lab_test_id = @sre;

-- Semen Analysis
INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('SEMEN', 'Semen Analysis', 'Clinical Pathology', 'Clinical Pathology', 'OTHER', 800.00, 4, 43, @now, @now);
SET @sem = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, unit, data_type, display_order, decimal_places, created_at, updated_at) VALUES
(@sem, 'VOL', 'Volume', 'mL', 'NUMERIC', 1, 1, @now, @now),
(@sem, 'SEM-PH', 'pH', NULL, 'NUMERIC', 2, 1, @now, @now),
(@sem, 'LIQ', 'Liquefaction Time', 'min', 'NUMERIC', 3, NULL, @now, @now),
(@sem, 'COUNT', 'Sperm Count', 'million/mL', 'NUMERIC', 4, 1, @now, @now),
(@sem, 'MOTIL', 'Total Motility', '%', 'NUMERIC', 5, 1, @now, @now),
(@sem, 'MORPH', 'Normal Morphology', '%', 'NUMERIC', 6, 1, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, low_value, high_value, created_at, updated_at)
SELECT id, v.lo, v.hi, @now, @now FROM master_test_parameter p
JOIN (VALUES
    ROW('VOL', 1.5, 6.0), ROW('SEM-PH', 7.2, 8.0), ROW('LIQ', NULL, 60.0),
    ROW('COUNT', 15.0, 250.0), ROW('MOTIL', 40.0, 100.0), ROW('MORPH', 4.0, 100.0)
) AS v(code, lo, hi) ON v.code = p.code
WHERE p.master_lab_test_id = @sem;

-- ===================================================================================
-- MICROBIOLOGY
-- ===================================================================================

-- Sputum for AFB (Acid Fast Bacilli)
INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('AFB', 'Sputum for AFB (ZN Stain)', 'Microbiology', 'Microbiology', 'SPUTUM', 300.00, 24, 44, @now, @now);
SET @afb = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, data_type, display_order, created_at, updated_at) VALUES
(@afb, 'AFB', 'AFB Smear', 'TEXT', 1, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, normal_text, created_at, updated_at)
SELECT id, 'No AFB seen', @now, @now FROM master_test_parameter WHERE master_lab_test_id = @afb AND code = 'AFB';

-- Urine Culture & Sensitivity
INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('URC', 'Urine Culture & Sensitivity', 'Microbiology', 'Microbiology', 'URINE', 900.00, 48, 45, @now, @now);
SET @urc = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, data_type, display_order, created_at, updated_at) VALUES
(@urc, 'GROWTH', 'Culture Growth', 'TEXT', 1, @now, @now),
(@urc, 'ORGANISM', 'Organism Identified', 'TEXT', 2, @now, @now),
(@urc, 'SENS', 'Antibiotic Sensitivity', 'TEXT', 3, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, normal_text, created_at, updated_at)
SELECT id, 'No growth after 48 hours', @now, @now FROM master_test_parameter WHERE master_lab_test_id = @urc AND code = 'GROWTH';
