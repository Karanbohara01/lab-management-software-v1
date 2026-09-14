-- Second expansion wave of the platform master lab catalogue (V53 general menu, V54 standard
-- expansion) — adds the specialty/referral-lab tier: advanced endocrinology, tumor markers,
-- autoimmune/rheumatology, infectious-disease serology relevant to Nepal, hematology genetic
-- screens, specialty biochemistry, coagulation extras, additional microbiology, narrative
-- histopathology/cytology reporting, and therapeutic drug monitoring / toxicology. Same
-- copy-once import philosophy and group_heading-driven print layout as V53/V54.

SET @now = UTC_TIMESTAMP(6);

-- ===================================================================================
-- ADVANCED ENDOCRINOLOGY
-- ===================================================================================

-- Anti-TPO & Anti-Thyroglobulin Antibodies
INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('ATPO', 'Anti-TPO & Anti-Thyroglobulin Antibodies', 'Endocrinology', 'Endocrinology', 'BLOOD_SERUM', 2200.00, 24, 46, @now, @now);
SET @atpo = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, unit, data_type, display_order, decimal_places, created_at, updated_at) VALUES
(@atpo, 'TPOAB', 'Anti-TPO Antibody', 'IU/mL', 'NUMERIC', 1, 1, @now, @now),
(@atpo, 'TGAB', 'Anti-Thyroglobulin Antibody', 'IU/mL', 'NUMERIC', 2, 1, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, low_value, high_value, created_at, updated_at)
SELECT id, v.lo, v.hi, @now, @now FROM master_test_parameter p
JOIN (VALUES ROW('TPOAB', 0.0, 34.0), ROW('TGAB', 0.0, 115.0)) AS v(code, lo, hi) ON v.code = p.code
WHERE p.master_lab_test_id = @atpo;

-- Fasting Insulin
INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('INSULIN', 'Fasting Insulin', 'Endocrinology', 'Endocrinology', 'BLOOD_SERUM', 1800.00, 24, 47, @now, @now);
SET @ins = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, unit, data_type, display_order, decimal_places, created_at, updated_at) VALUES
(@ins, 'INS', 'Fasting Insulin', 'µIU/mL', 'NUMERIC', 1, 1, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, low_value, high_value, created_at, updated_at)
SELECT id, 2.6, 24.9, @now, @now FROM master_test_parameter WHERE master_lab_test_id = @ins AND code = 'INS';

-- C-Peptide
INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('CPEP', 'C-Peptide', 'Endocrinology', 'Endocrinology', 'BLOOD_SERUM', 1800.00, 24, 48, @now, @now);
SET @cpep = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, unit, data_type, display_order, decimal_places, created_at, updated_at) VALUES
(@cpep, 'CPEP', 'C-Peptide', 'ng/mL', 'NUMERIC', 1, 2, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, low_value, high_value, created_at, updated_at)
SELECT id, 0.8, 3.85, @now, @now FROM master_test_parameter WHERE master_lab_test_id = @cpep AND code = 'CPEP';

-- Parathyroid Hormone (Intact PTH)
INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('PTH', 'Parathyroid Hormone (Intact PTH)', 'Endocrinology', 'Endocrinology', 'BLOOD_SERUM', 2500.00, 24, 49, @now, @now);
SET @pth = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, unit, data_type, display_order, decimal_places, created_at, updated_at) VALUES
(@pth, 'PTH', 'Intact PTH', 'pg/mL', 'NUMERIC', 1, 1, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, low_value, high_value, created_at, updated_at)
SELECT id, 15.0, 65.0, @now, @now FROM master_test_parameter WHERE master_lab_test_id = @pth AND code = 'PTH';

-- Growth Hormone
INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('GH', 'Growth Hormone (Random)', 'Endocrinology', 'Endocrinology', 'BLOOD_SERUM', 2000.00, 24, 50, @now, @now);
SET @gh = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, unit, data_type, display_order, decimal_places, created_at, updated_at) VALUES
(@gh, 'GH', 'Growth Hormone', 'ng/mL', 'NUMERIC', 1, 1, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, low_value, high_value, created_at, updated_at)
SELECT id, 0.0, 5.0, @now, @now FROM master_test_parameter WHERE master_lab_test_id = @gh AND code = 'GH';

-- ACTH
INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('ACTH', 'ACTH (Morning)', 'Endocrinology', 'Endocrinology', 'BLOOD_SERUM', 2500.00, 24, 51, @now, @now);
SET @acth = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, unit, data_type, display_order, decimal_places, created_at, updated_at) VALUES
(@acth, 'ACTH', 'ACTH (8 AM)', 'pg/mL', 'NUMERIC', 1, 1, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, low_value, high_value, created_at, updated_at)
SELECT id, 7.2, 63.3, @now, @now FROM master_test_parameter WHERE master_lab_test_id = @acth AND code = 'ACTH';

-- Aldosterone & Renin
INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('ALDO', 'Aldosterone & Renin (Aldosterone-Renin Ratio)', 'Endocrinology', 'Endocrinology', 'BLOOD_SERUM', 3200.00, 48, 52, @now, @now);
SET @aldo = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, unit, data_type, display_order, decimal_places, created_at, updated_at) VALUES
(@aldo, 'ALDO', 'Aldosterone (Upright)', 'ng/dL', 'NUMERIC', 1, 1, @now, @now),
(@aldo, 'RENIN', 'Plasma Renin Activity', 'ng/mL/hr', 'NUMERIC', 2, 2, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, low_value, high_value, created_at, updated_at)
SELECT id, v.lo, v.hi, @now, @now FROM master_test_parameter p
JOIN (VALUES ROW('ALDO', 3.6, 24.0), ROW('RENIN', 0.6, 4.3)) AS v(code, lo, hi) ON v.code = p.code
WHERE p.master_lab_test_id = @aldo;

-- Beta-hCG (Quantitative, Serum)
INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('BHCG', 'Beta-hCG (Quantitative, Serum)', 'Endocrinology', 'Endocrinology', 'BLOOD_SERUM', 1200.00, 6, 53, @now, @now);
SET @bhcg = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, unit, data_type, display_order, decimal_places, created_at, updated_at) VALUES
(@bhcg, 'BHCG', 'Beta-hCG', 'mIU/mL', 'NUMERIC', 1, 1, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, low_value, high_value, normal_text, created_at, updated_at)
SELECT id, 0.0, 5.0, 'Non-pregnant reference shown; rises rapidly in early pregnancy — interpret against gestational age', @now, @now
FROM master_test_parameter WHERE master_lab_test_id = @bhcg AND code = 'BHCG';

-- Anti-Mullerian Hormone (AMH)
INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('AMH', 'Anti-Mullerian Hormone (AMH)', 'Endocrinology', 'Endocrinology', 'BLOOD_SERUM', 3500.00, 48, 54, @now, @now);
SET @amh = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, unit, data_type, display_order, decimal_places, created_at, updated_at) VALUES
(@amh, 'AMH', 'AMH', 'ng/mL', 'NUMERIC', 1, 2, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, low_value, high_value, normal_text, created_at, updated_at)
SELECT id, 1.0, 4.0, 'Age-dependent ovarian reserve marker — interpret against age-specific chart', @now, @now
FROM master_test_parameter WHERE master_lab_test_id = @amh AND code = 'AMH';

-- DHEA-Sulfate
INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('DHEAS', 'DHEA-Sulfate', 'Endocrinology', 'Endocrinology', 'BLOOD_SERUM', 2000.00, 24, 55, @now, @now);
SET @dheas = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, unit, data_type, display_order, created_at, updated_at) VALUES
(@dheas, 'DHEAS', 'DHEA-Sulfate', 'µg/dL', 'NUMERIC', 1, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, applies_to_gender, low_value, high_value, created_at, updated_at)
SELECT id, 'MALE', 80.0, 560.0, @now, @now FROM master_test_parameter WHERE master_lab_test_id = @dheas AND code = 'DHEAS';
INSERT INTO master_reference_range (master_test_parameter_id, applies_to_gender, low_value, high_value, created_at, updated_at)
SELECT id, 'FEMALE', 35.0, 430.0, @now, @now FROM master_test_parameter WHERE master_lab_test_id = @dheas AND code = 'DHEAS';

-- ===================================================================================
-- TUMOR MARKERS
-- ===================================================================================

INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('CEA', 'Carcinoembryonic Antigen (CEA)', 'Serology & Immunology', 'Tumor Markers', 'BLOOD_SERUM', 1800.00, 24, 56, @now, @now);
SET @cea = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, unit, data_type, display_order, decimal_places, created_at, updated_at) VALUES
(@cea, 'CEA', 'CEA', 'ng/mL', 'NUMERIC', 1, 1, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, low_value, high_value, created_at, updated_at)
SELECT id, 0.0, 3.0, @now, @now FROM master_test_parameter WHERE master_lab_test_id = @cea AND code = 'CEA';

INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('AFP', 'Alpha-Fetoprotein (AFP)', 'Serology & Immunology', 'Tumor Markers', 'BLOOD_SERUM', 1800.00, 24, 57, @now, @now);
SET @afp = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, unit, data_type, display_order, decimal_places, created_at, updated_at) VALUES
(@afp, 'AFP', 'AFP', 'ng/mL', 'NUMERIC', 1, 1, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, low_value, high_value, created_at, updated_at)
SELECT id, 0.0, 10.0, @now, @now FROM master_test_parameter WHERE master_lab_test_id = @afp AND code = 'AFP';

INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('CA125', 'CA-125', 'Serology & Immunology', 'Tumor Markers', 'BLOOD_SERUM', 2200.00, 24, 58, @now, @now);
SET @ca125 = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, unit, data_type, display_order, decimal_places, created_at, updated_at) VALUES
(@ca125, 'CA125', 'CA-125', 'U/mL', 'NUMERIC', 1, 1, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, low_value, high_value, created_at, updated_at)
SELECT id, 0.0, 35.0, @now, @now FROM master_test_parameter WHERE master_lab_test_id = @ca125 AND code = 'CA125';

INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('CA199', 'CA-19-9', 'Serology & Immunology', 'Tumor Markers', 'BLOOD_SERUM', 2200.00, 24, 59, @now, @now);
SET @ca199 = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, unit, data_type, display_order, decimal_places, created_at, updated_at) VALUES
(@ca199, 'CA199', 'CA-19-9', 'U/mL', 'NUMERIC', 1, 1, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, low_value, high_value, created_at, updated_at)
SELECT id, 0.0, 37.0, @now, @now FROM master_test_parameter WHERE master_lab_test_id = @ca199 AND code = 'CA199';

INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('CA153', 'CA-15-3', 'Serology & Immunology', 'Tumor Markers', 'BLOOD_SERUM', 2200.00, 24, 60, @now, @now);
SET @ca153 = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, unit, data_type, display_order, decimal_places, created_at, updated_at) VALUES
(@ca153, 'CA153', 'CA-15-3', 'U/mL', 'NUMERIC', 1, 1, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, low_value, high_value, created_at, updated_at)
SELECT id, 0.0, 31.3, @now, @now FROM master_test_parameter WHERE master_lab_test_id = @ca153 AND code = 'CA153';

INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('FPSA', 'Free PSA (with Free/Total Ratio)', 'Serology & Immunology', 'Tumor Markers', 'BLOOD_SERUM', 2000.00, 24, 61, @now, @now);
SET @fpsa = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, unit, data_type, display_order, decimal_places, created_at, updated_at) VALUES
(@fpsa, 'FPSA', 'Free PSA', 'ng/mL', 'NUMERIC', 1, 2, @now, @now),
(@fpsa, 'FTRATIO', 'Free/Total PSA Ratio', '%', 'NUMERIC', 2, 1, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, normal_text, created_at, updated_at)
SELECT id, 'Ratio >25% favours benign; <15% raises malignancy suspicion — interpret with Total PSA', @now, @now
FROM master_test_parameter WHERE master_lab_test_id = @fpsa AND code = 'FTRATIO';

-- ===================================================================================
-- AUTOIMMUNE / RHEUMATOLOGY
-- ===================================================================================

INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('ANA', 'Antinuclear Antibody (ANA)', 'Serology & Immunology', 'Autoimmune', 'BLOOD_SERUM', 1500.00, 24, 62, @now, @now);
SET @ana = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, data_type, display_order, created_at, updated_at) VALUES
(@ana, 'ANA', 'ANA (IFA)', 'TEXT', 1, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, normal_text, created_at, updated_at)
SELECT id, 'Negative (titre < 1:40)', @now, @now FROM master_test_parameter WHERE master_lab_test_id = @ana AND code = 'ANA';

INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('DSDNA', 'Anti-dsDNA Antibody', 'Serology & Immunology', 'Autoimmune', 'BLOOD_SERUM', 1800.00, 24, 63, @now, @now);
SET @dsdna = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, unit, data_type, display_order, created_at, updated_at) VALUES
(@dsdna, 'DSDNA', 'Anti-dsDNA', 'IU/mL', 'NUMERIC', 1, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, low_value, high_value, created_at, updated_at)
SELECT id, 0.0, 30.0, @now, @now FROM master_test_parameter WHERE master_lab_test_id = @dsdna AND code = 'DSDNA';

INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('CCP', 'Anti-CCP Antibody', 'Serology & Immunology', 'Autoimmune', 'BLOOD_SERUM', 1800.00, 24, 64, @now, @now);
SET @ccp = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, unit, data_type, display_order, created_at, updated_at) VALUES
(@ccp, 'CCP', 'Anti-CCP', 'U/mL', 'NUMERIC', 1, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, low_value, high_value, created_at, updated_at)
SELECT id, 0.0, 20.0, @now, @now FROM master_test_parameter WHERE master_lab_test_id = @ccp AND code = 'CCP';

INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('COMPL', 'Complement C3 & C4', 'Serology & Immunology', 'Autoimmune', 'BLOOD_SERUM', 1400.00, 24, 65, @now, @now);
SET @compl = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, unit, data_type, display_order, created_at, updated_at) VALUES
(@compl, 'C3', 'Complement C3', 'mg/dL', 'NUMERIC', 1, @now, @now),
(@compl, 'C4', 'Complement C4', 'mg/dL', 'NUMERIC', 2, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, low_value, high_value, created_at, updated_at)
SELECT id, v.lo, v.hi, @now, @now FROM master_test_parameter p
JOIN (VALUES ROW('C3', 90.0, 180.0), ROW('C4', 10.0, 40.0)) AS v(code, lo, hi) ON v.code = p.code
WHERE p.master_lab_test_id = @compl;

INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('ANCA', 'ANCA (p-ANCA / c-ANCA)', 'Serology & Immunology', 'Autoimmune', 'BLOOD_SERUM', 2200.00, 24, 66, @now, @now);
SET @anca = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, data_type, display_order, created_at, updated_at) VALUES
(@anca, 'PANCA', 'p-ANCA', 'TEXT', 1, @now, @now),
(@anca, 'CANCA', 'c-ANCA', 'TEXT', 2, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, normal_text, created_at, updated_at)
SELECT id, 'Negative', @now, @now FROM master_test_parameter WHERE master_lab_test_id = @anca;

-- ===================================================================================
-- INFECTIOUS DISEASE SEROLOGY (Nepal-relevant)
-- ===================================================================================

INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('TYPHIDOT', 'Typhidot (IgM / IgG)', 'Serology & Immunology', 'Serology', 'BLOOD_SERUM', 900.00, 4, 67, @now, @now);
SET @typd = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, data_type, display_order, created_at, updated_at) VALUES
(@typd, 'TD-IGM', 'S. Typhi IgM', 'TEXT', 1, @now, @now),
(@typd, 'TD-IGG', 'S. Typhi IgG', 'TEXT', 2, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, normal_text, created_at, updated_at)
SELECT id, 'Negative', @now, @now FROM master_test_parameter WHERE master_lab_test_id = @typd;

INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('LEPTO', 'Leptospira IgM', 'Serology & Immunology', 'Serology', 'BLOOD_SERUM', 900.00, 4, 68, @now, @now);
SET @lepto = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, data_type, display_order, created_at, updated_at) VALUES
(@lepto, 'LEPTO', 'Leptospira IgM', 'TEXT', 1, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, normal_text, created_at, updated_at)
SELECT id, 'Negative', @now, @now FROM master_test_parameter WHERE master_lab_test_id = @lepto AND code = 'LEPTO';

INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('CHIKV', 'Chikungunya IgM', 'Serology & Immunology', 'Serology', 'BLOOD_SERUM', 900.00, 4, 69, @now, @now);
SET @chik = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, data_type, display_order, created_at, updated_at) VALUES
(@chik, 'CHIKV', 'Chikungunya IgM', 'TEXT', 1, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, normal_text, created_at, updated_at)
SELECT id, 'Negative', @now, @now FROM master_test_parameter WHERE master_lab_test_id = @chik AND code = 'CHIKV';

INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('JE', 'Japanese Encephalitis IgM', 'Serology & Immunology', 'Serology', 'BLOOD_SERUM', 1500.00, 24, 70, @now, @now);
SET @je = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, data_type, display_order, created_at, updated_at) VALUES
(@je, 'JE', 'JE IgM (ELISA)', 'TEXT', 1, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, normal_text, created_at, updated_at)
SELECT id, 'Negative', @now, @now FROM master_test_parameter WHERE master_lab_test_id = @je AND code = 'JE';

INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('SCRUB', 'Scrub Typhus IgM', 'Serology & Immunology', 'Serology', 'BLOOD_SERUM', 1200.00, 24, 71, @now, @now);
SET @scrub = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, data_type, display_order, created_at, updated_at) VALUES
(@scrub, 'SCRUB', 'Scrub Typhus IgM', 'TEXT', 1, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, normal_text, created_at, updated_at)
SELECT id, 'Negative', @now, @now FROM master_test_parameter WHERE master_lab_test_id = @scrub AND code = 'SCRUB';

INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('HPYLORI', 'H. pylori Antibody / Stool Antigen', 'Serology & Immunology', 'Serology', 'BLOOD_SERUM', 900.00, 4, 72, @now, @now);
SET @hpy = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, data_type, display_order, created_at, updated_at) VALUES
(@hpy, 'HPY-AB', 'H. pylori Antibody (Serum)', 'TEXT', 1, @now, @now),
(@hpy, 'HPY-AG', 'H. pylori Antigen (Stool)', 'TEXT', 2, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, normal_text, created_at, updated_at)
SELECT id, 'Negative', @now, @now FROM master_test_parameter WHERE master_lab_test_id = @hpy;

INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('TORCH', 'TORCH Panel (Toxo, Rubella, CMV, HSV)', 'Serology & Immunology', 'Serology', 'BLOOD_SERUM', 3500.00, 24, 73, @now, @now);
SET @torch = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, data_type, display_order, group_heading, created_at, updated_at) VALUES
(@torch, 'TOXO-IGG', 'Toxoplasma IgG', 'TEXT', 1, 'Toxoplasma', @now, @now),
(@torch, 'TOXO-IGM', 'Toxoplasma IgM', 'TEXT', 2, 'Toxoplasma', @now, @now),
(@torch, 'RUB-IGG', 'Rubella IgG', 'TEXT', 3, 'Rubella', @now, @now),
(@torch, 'RUB-IGM', 'Rubella IgM', 'TEXT', 4, 'Rubella', @now, @now),
(@torch, 'CMV-IGG', 'CMV IgG', 'TEXT', 5, 'Cytomegalovirus (CMV)', @now, @now),
(@torch, 'CMV-IGM', 'CMV IgM', 'TEXT', 6, 'Cytomegalovirus (CMV)', @now, @now),
(@torch, 'HSV-IGG', 'HSV IgG', 'TEXT', 7, 'Herpes Simplex Virus (HSV)', @now, @now),
(@torch, 'HSV-IGM', 'HSV IgM', 'TEXT', 8, 'Herpes Simplex Virus (HSV)', @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, normal_text, created_at, updated_at)
SELECT id, 'Negative', @now, @now FROM master_test_parameter WHERE master_lab_test_id = @torch;

INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('COVID', 'COVID-19 Antigen & Antibody (IgG/IgM)', 'Serology & Immunology', 'Serology', 'SWAB', 1200.00, 2, 74, @now, @now);
SET @covid = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, data_type, display_order, created_at, updated_at) VALUES
(@covid, 'COV-AG', 'COVID-19 Rapid Antigen', 'POSITIVE_NEGATIVE', 1, @now, @now),
(@covid, 'COV-IGG', 'COVID-19 IgG Antibody', 'TEXT', 2, @now, @now),
(@covid, 'COV-IGM', 'COVID-19 IgM Antibody', 'TEXT', 3, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, normal_text, created_at, updated_at)
SELECT id, 'Negative', @now, @now FROM master_test_parameter WHERE master_lab_test_id = @covid AND code IN ('COV-IGG', 'COV-IGM');

-- ===================================================================================
-- HEMATOLOGY — GENETIC / SCREENING
-- ===================================================================================

INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('G6PD', 'G6PD Screening', 'Hematology', 'Hematology', 'BLOOD_EDTA', 700.00, 24, 75, @now, @now);
SET @g6pd = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, data_type, display_order, created_at, updated_at) VALUES
(@g6pd, 'G6PD', 'G6PD Activity', 'TEXT', 1, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, normal_text, created_at, updated_at)
SELECT id, 'Normal (no deficiency)', @now, @now FROM master_test_parameter WHERE master_lab_test_id = @g6pd AND code = 'G6PD';

INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('HBELEC', 'Haemoglobin Electrophoresis (Thalassemia Screen)', 'Hematology', 'Hematology', 'BLOOD_EDTA', 2000.00, 48, 76, @now, @now);
SET @hbe = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, unit, data_type, display_order, decimal_places, created_at, updated_at) VALUES
(@hbe, 'HBA', 'HbA', '%', 'NUMERIC', 1, 1, @now, @now),
(@hbe, 'HBA2', 'HbA2', '%', 'NUMERIC', 2, 1, @now, @now),
(@hbe, 'HBF', 'HbF', '%', 'NUMERIC', 3, 1, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, low_value, high_value, created_at, updated_at)
SELECT id, v.lo, v.hi, @now, @now FROM master_test_parameter p
JOIN (VALUES ROW('HBA', 96.0, 98.0), ROW('HBA2', 1.5, 3.5), ROW('HBF', 0.0, 2.0)) AS v(code, lo, hi) ON v.code = p.code
WHERE p.master_lab_test_id = @hbe;

INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('SICKLE', 'Sickle Cell Test', 'Hematology', 'Hematology', 'BLOOD_EDTA', 500.00, 4, 77, @now, @now);
SET @sick = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, data_type, display_order, created_at, updated_at) VALUES
(@sick, 'SICKLE', 'Sickling Test', 'TEXT', 1, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, normal_text, created_at, updated_at)
SELECT id, 'Negative', @now, @now FROM master_test_parameter WHERE master_lab_test_id = @sick AND code = 'SICKLE';

-- ===================================================================================
-- SPECIALTY BIOCHEMISTRY
-- ===================================================================================

INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('AMMONIA', 'Serum Ammonia', 'Biochemistry', 'Biochemistry', 'BLOOD_SERUM', 1200.00, 3, 78, @now, @now);
SET @amm = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, unit, data_type, display_order, created_at, updated_at) VALUES
(@amm, 'NH3', 'Ammonia', 'µmol/L', 'NUMERIC', 1, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, low_value, high_value, created_at, updated_at)
SELECT id, 15.0, 45.0, @now, @now FROM master_test_parameter WHERE master_lab_test_id = @amm AND code = 'NH3';

INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('HCYS', 'Homocysteine', 'Biochemistry', 'Biochemistry', 'BLOOD_SERUM', 2000.00, 24, 79, @now, @now);
SET @hcy = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, unit, data_type, display_order, decimal_places, created_at, updated_at) VALUES
(@hcy, 'HCYS', 'Homocysteine', 'µmol/L', 'NUMERIC', 1, 1, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, low_value, high_value, created_at, updated_at)
SELECT id, 5.0, 15.0, @now, @now FROM master_test_parameter WHERE master_lab_test_id = @hcy AND code = 'HCYS';

INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('LACTATE', 'Serum Lactate', 'Biochemistry', 'Biochemistry', 'BLOOD_SERUM', 800.00, 2, 80, @now, @now);
SET @lac = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, unit, data_type, display_order, decimal_places, created_at, updated_at) VALUES
(@lac, 'LACT', 'Lactate', 'mmol/L', 'NUMERIC', 1, 1, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, low_value, high_value, critical_high, created_at, updated_at)
SELECT id, 0.5, 2.2, 4.0, @now, @now FROM master_test_parameter WHERE master_lab_test_id = @lac AND code = 'LACT';

INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('PCT', 'Procalcitonin (PCT)', 'Biochemistry', 'Biochemistry', 'BLOOD_SERUM', 2500.00, 6, 81, @now, @now);
SET @pct = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, unit, data_type, display_order, decimal_places, created_at, updated_at) VALUES
(@pct, 'PCT', 'Procalcitonin', 'ng/mL', 'NUMERIC', 1, 2, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, low_value, high_value, normal_text, created_at, updated_at)
SELECT id, 0.0, 0.05, '<0.5: low risk of sepsis, >2.0: high risk — interpret with clinical picture', @now, @now
FROM master_test_parameter WHERE master_lab_test_id = @pct AND code = 'PCT';

INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('PREALB', 'Pre-Albumin (Transthyretin)', 'Biochemistry', 'Biochemistry', 'BLOOD_SERUM', 1500.00, 24, 82, @now, @now);
SET @preal = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, unit, data_type, display_order, created_at, updated_at) VALUES
(@preal, 'PREALB', 'Pre-Albumin', 'mg/dL', 'NUMERIC', 1, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, low_value, high_value, created_at, updated_at)
SELECT id, 20.0, 40.0, @now, @now FROM master_test_parameter WHERE master_lab_test_id = @preal AND code = 'PREALB';

INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('CERULO', 'Ceruloplasmin', 'Biochemistry', 'Biochemistry', 'BLOOD_SERUM', 1800.00, 24, 83, @now, @now);
SET @cerulo = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, unit, data_type, display_order, created_at, updated_at) VALUES
(@cerulo, 'CERULO', 'Ceruloplasmin', 'mg/dL', 'NUMERIC', 1, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, low_value, high_value, created_at, updated_at)
SELECT id, 20.0, 60.0, @now, @now FROM master_test_parameter WHERE master_lab_test_id = @cerulo AND code = 'CERULO';

INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('A1AT', 'Alpha-1 Antitrypsin', 'Biochemistry', 'Biochemistry', 'BLOOD_SERUM', 2000.00, 24, 84, @now, @now);
SET @a1at = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, unit, data_type, display_order, created_at, updated_at) VALUES
(@a1at, 'A1AT', 'Alpha-1 Antitrypsin', 'mg/dL', 'NUMERIC', 1, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, low_value, high_value, created_at, updated_at)
SELECT id, 100.0, 200.0, @now, @now FROM master_test_parameter WHERE master_lab_test_id = @a1at AND code = 'A1AT';

-- ===================================================================================
-- COAGULATION EXTRAS
-- ===================================================================================

INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('DDIMER', 'D-Dimer', 'Coagulation', 'Coagulation', 'BLOOD_CITRATE', 1500.00, 3, 85, @now, @now);
SET @ddim = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, unit, data_type, display_order, decimal_places, created_at, updated_at) VALUES
(@ddim, 'DDIMER', 'D-Dimer', 'mg/L FEU', 'NUMERIC', 1, 2, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, low_value, high_value, created_at, updated_at)
SELECT id, 0.0, 0.5, @now, @now FROM master_test_parameter WHERE master_lab_test_id = @ddim AND code = 'DDIMER';

INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('FIBRIN', 'Fibrinogen', 'Coagulation', 'Coagulation', 'BLOOD_CITRATE', 1200.00, 3, 86, @now, @now);
SET @fib = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, unit, data_type, display_order, created_at, updated_at) VALUES
(@fib, 'FIBRIN', 'Fibrinogen', 'mg/dL', 'NUMERIC', 1, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, low_value, high_value, created_at, updated_at)
SELECT id, 200.0, 400.0, @now, @now FROM master_test_parameter WHERE master_lab_test_id = @fib AND code = 'FIBRIN';

-- ===================================================================================
-- MICROBIOLOGY EXTRAS
-- ===================================================================================

INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('STLVIRAL', 'Stool for Rotavirus / Adenovirus Antigen', 'Microbiology', 'Microbiology', 'STOOL', 900.00, 4, 87, @now, @now);
SET @stlv = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, data_type, display_order, created_at, updated_at) VALUES
(@stlv, 'ROTA', 'Rotavirus Antigen', 'POSITIVE_NEGATIVE', 1, @now, @now),
(@stlv, 'ADENO', 'Adenovirus Antigen', 'POSITIVE_NEGATIVE', 2, @now, @now);

INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('THR-CS', 'Throat Swab Culture & Sensitivity', 'Microbiology', 'Microbiology', 'SWAB', 900.00, 48, 88, @now, @now);
SET @thrcs = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, data_type, display_order, created_at, updated_at) VALUES
(@thrcs, 'GROWTH', 'Culture Growth', 'TEXT', 1, @now, @now),
(@thrcs, 'ORGANISM', 'Organism Identified', 'TEXT', 2, @now, @now),
(@thrcs, 'SENS', 'Antibiotic Sensitivity', 'TEXT', 3, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, normal_text, created_at, updated_at)
SELECT id, 'No growth / normal flora only', @now, @now FROM master_test_parameter WHERE master_lab_test_id = @thrcs AND code = 'GROWTH';

-- CSF Analysis (physical / biochemical / microscopic / culture)
INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('CSF', 'CSF Analysis (Physical, Biochemical, Microscopic, Culture)', 'Microbiology', 'Microbiology', 'CSF', 1500.00, 24, 89, @now, @now);
SET @csf = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, unit, data_type, display_order, group_heading, created_at, updated_at) VALUES
(@csf, 'CSF-COL', 'Colour', NULL, 'TEXT', 1, 'Physical Examination', @now, @now),
(@csf, 'CSF-APP', 'Appearance', NULL, 'TEXT', 2, 'Physical Examination', @now, @now),
(@csf, 'CSF-GLU', 'Glucose', 'mg/dL', 'NUMERIC', 3, 'Biochemical Examination', @now, @now),
(@csf, 'CSF-PROT', 'Protein', 'mg/dL', 'NUMERIC', 4, 'Biochemical Examination', @now, @now),
(@csf, 'CSF-CL', 'Chloride', 'mmol/L', 'NUMERIC', 5, 'Biochemical Examination', @now, @now),
(@csf, 'CSF-CELL', 'Total Cell Count', 'cells/µL', 'NUMERIC', 6, 'Microscopic Examination', @now, @now),
(@csf, 'CSF-DIFF', 'Differential Count', NULL, 'TEXT', 7, 'Microscopic Examination', @now, @now),
(@csf, 'CSF-GRAM', 'Gram Stain', NULL, 'TEXT', 8, 'Culture & Stain', @now, @now),
(@csf, 'CSF-CULT', 'Culture', NULL, 'TEXT', 9, 'Culture & Stain', @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, low_value, high_value, normal_text, created_at, updated_at)
SELECT id, v.lo, v.hi, v.txt, @now, @now FROM master_test_parameter p
JOIN (VALUES
    ROW('CSF-COL', NULL, NULL, 'Colourless'), ROW('CSF-APP', NULL, NULL, 'Clear'),
    ROW('CSF-GLU', 40.0, 70.0, NULL), ROW('CSF-PROT', 15.0, 45.0, NULL), ROW('CSF-CL', 118.0, 132.0, NULL),
    ROW('CSF-CELL', 0.0, 5.0, NULL), ROW('CSF-DIFF', NULL, NULL, 'Lymphocytes predominant'),
    ROW('CSF-GRAM', NULL, NULL, 'No organisms seen'), ROW('CSF-CULT', NULL, NULL, 'No growth after 48 hours')
) AS v(code, lo, hi, txt) ON v.code = p.code
WHERE p.master_lab_test_id = @csf;

-- Body Fluid Analysis (pleural / ascitic / synovial)
INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('BFLUID', 'Body Fluid Analysis (Pleural / Ascitic / Synovial)', 'Microbiology', 'Microbiology', 'BODY_FLUID', 1200.00, 24, 90, @now, @now);
SET @bfl = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, unit, data_type, display_order, group_heading, created_at, updated_at) VALUES
(@bfl, 'BF-APP', 'Appearance', NULL, 'TEXT', 1, 'Physical Examination', @now, @now),
(@bfl, 'BF-CELL', 'Total Cell Count', 'cells/µL', 'NUMERIC', 2, 'Microscopic Examination', @now, @now),
(@bfl, 'BF-DIFF', 'Differential Count', NULL, 'TEXT', 3, 'Microscopic Examination', @now, @now),
(@bfl, 'BF-PROT', 'Protein', 'g/dL', 'NUMERIC', 4, 'Biochemical Examination', @now, @now),
(@bfl, 'BF-GLU', 'Glucose', 'mg/dL', 'NUMERIC', 5, 'Biochemical Examination', @now, @now),
(@bfl, 'BF-LDH', 'LDH', 'U/L', 'NUMERIC', 6, 'Biochemical Examination', @now, @now),
(@bfl, 'BF-CULT', 'Culture', NULL, 'TEXT', 7, 'Culture', @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, normal_text, created_at, updated_at)
SELECT id, v.txt, @now, @now FROM master_test_parameter p
JOIN (VALUES ROW('BF-APP', 'Clear, straw-coloured'), ROW('BF-DIFF', 'Mesothelial cells predominant'), ROW('BF-CULT', 'No growth after 48 hours')) AS v(code, txt) ON v.code = p.code
WHERE p.master_lab_test_id = @bfl;

-- Gram Stain
INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('GRAM', 'Gram Stain', 'Microbiology', 'Microbiology', 'OTHER', 300.00, 2, 91, @now, @now);
SET @gram = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, data_type, display_order, created_at, updated_at) VALUES
(@gram, 'GRAM', 'Gram Stain Findings', 'TEXT', 1, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, normal_text, created_at, updated_at)
SELECT id, 'No organisms seen', @now, @now FROM master_test_parameter WHERE master_lab_test_id = @gram AND code = 'GRAM';

-- ===================================================================================
-- MOLECULAR DIAGNOSTICS
-- ===================================================================================

INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('COVPCR', 'COVID-19 RT-PCR', 'Molecular Diagnostics', 'Molecular Diagnostics', 'SWAB', 2500.00, 24, 92, @now, @now);
SET @covpcr = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, data_type, display_order, created_at, updated_at) VALUES
(@covpcr, 'COVPCR', 'SARS-CoV-2 RNA', 'TEXT', 1, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, normal_text, created_at, updated_at)
SELECT id, 'Not detected', @now, @now FROM master_test_parameter WHERE master_lab_test_id = @covpcr AND code = 'COVPCR';

INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('TBPCR', 'TB PCR (GeneXpert MTB/RIF)', 'Molecular Diagnostics', 'Molecular Diagnostics', 'SPUTUM', 3500.00, 6, 93, @now, @now);
SET @tbpcr = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, data_type, display_order, created_at, updated_at) VALUES
(@tbpcr, 'MTB', 'MTB Detection', 'TEXT', 1, @now, @now),
(@tbpcr, 'RIF', 'Rifampicin Resistance', 'TEXT', 2, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, normal_text, created_at, updated_at)
SELECT id, v.txt, @now, @now FROM master_test_parameter p
JOIN (VALUES ROW('MTB', 'MTB not detected'), ROW('RIF', 'Not applicable (no MTB detected)')) AS v(code, txt) ON v.code = p.code
WHERE p.master_lab_test_id = @tbpcr;

-- ===================================================================================
-- HISTOPATHOLOGY & CYTOLOGY (narrative reporting)
-- ===================================================================================

INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('BIOPSY', 'Histopathology (Biopsy) Report', 'Histopathology', 'Histopathology', 'TISSUE', 2500.00, 72, 94, @now, @now);
SET @biop = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, data_type, display_order, created_at, updated_at) VALUES
(@biop, 'GROSS', 'Gross Description', 'TEXT', 1, @now, @now),
(@biop, 'MICRO', 'Microscopic Description', 'TEXT', 2, @now, @now),
(@biop, 'DIAG', 'Diagnosis / Impression', 'TEXT', 3, @now, @now);

INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('PAP', 'Pap Smear (Cervical Cytology)', 'Cytology', 'Cytology', 'SWAB', 800.00, 48, 95, @now, @now);
SET @pap = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, data_type, display_order, created_at, updated_at) VALUES
(@pap, 'ADEQ', 'Specimen Adequacy', 'TEXT', 1, @now, @now),
(@pap, 'FINDINGS', 'Findings (Bethesda System)', 'TEXT', 2, @now, @now),
(@pap, 'DIAG', 'Diagnosis / Impression', 'TEXT', 3, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, normal_text, created_at, updated_at)
SELECT id, 'Negative for Intraepithelial Lesion or Malignancy (NILM)', @now, @now
FROM master_test_parameter WHERE master_lab_test_id = @pap AND code = 'FINDINGS';

INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('FNAC', 'FNAC (Fine Needle Aspiration Cytology)', 'Cytology', 'Cytology', 'TISSUE', 1500.00, 48, 96, @now, @now);
SET @fnac = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, data_type, display_order, created_at, updated_at) VALUES
(@fnac, 'ADEQ', 'Specimen Adequacy', 'TEXT', 1, @now, @now),
(@fnac, 'MICRO', 'Microscopic Findings', 'TEXT', 2, @now, @now),
(@fnac, 'DIAG', 'Diagnosis / Impression', 'TEXT', 3, @now, @now);

-- ===================================================================================
-- TOXICOLOGY / THERAPEUTIC DRUG MONITORING
-- ===================================================================================

INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('UDS', 'Urine Drug Screen (5-Panel)', 'Biochemistry', 'Toxicology', 'URINE', 1500.00, 2, 97, @now, @now);
SET @uds = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, data_type, display_order, created_at, updated_at) VALUES
(@uds, 'OPI', 'Opiates', 'POSITIVE_NEGATIVE', 1, @now, @now),
(@uds, 'THC', 'Cannabis (THC)', 'POSITIVE_NEGATIVE', 2, @now, @now),
(@uds, 'AMP', 'Amphetamine', 'POSITIVE_NEGATIVE', 3, @now, @now),
(@uds, 'COC', 'Cocaine', 'POSITIVE_NEGATIVE', 4, @now, @now),
(@uds, 'BZD', 'Benzodiazepines', 'POSITIVE_NEGATIVE', 5, @now, @now);

INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('DIGOXIN', 'Digoxin Level (TDM)', 'Biochemistry', 'Therapeutic Drug Monitoring', 'BLOOD_SERUM', 1800.00, 6, 98, @now, @now);
SET @dig = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, unit, data_type, display_order, decimal_places, created_at, updated_at) VALUES
(@dig, 'DIGOXIN', 'Digoxin', 'ng/mL', 'NUMERIC', 1, 2, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, low_value, high_value, critical_high, created_at, updated_at)
SELECT id, 0.8, 2.0, 2.5, @now, @now FROM master_test_parameter WHERE master_lab_test_id = @dig AND code = 'DIGOXIN';

INSERT INTO master_lab_test (code, name, department_name, category, specimen_type, suggested_price, turnaround_hours, display_order, created_at, updated_at)
VALUES ('PHENYT', 'Phenytoin Level (TDM)', 'Biochemistry', 'Therapeutic Drug Monitoring', 'BLOOD_SERUM', 1800.00, 6, 99, @now, @now);
SET @phen = LAST_INSERT_ID();
INSERT INTO master_test_parameter (master_lab_test_id, code, name, unit, data_type, display_order, created_at, updated_at) VALUES
(@phen, 'PHENYT', 'Phenytoin', 'µg/mL', 'NUMERIC', 1, @now, @now);
INSERT INTO master_reference_range (master_test_parameter_id, low_value, high_value, critical_high, created_at, updated_at)
SELECT id, 10.0, 20.0, 30.0, @now, @now FROM master_test_parameter WHERE master_lab_test_id = @phen AND code = 'PHENYT';
