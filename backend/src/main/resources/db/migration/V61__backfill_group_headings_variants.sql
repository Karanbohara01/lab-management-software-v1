-- Follow-up to V60: catches a few real parameter-name spelling variants across clinics that the
-- exact-name match in V60 missed (found by querying post-V60 for still-NULL group_heading rows
-- whose name obviously belongs to a known panel, e.g. "Blood Urea Nitrogen" instead of "BUN",
-- "Calcium, Total" instead of "Calcium"). Same non-destructive rule: only fills rows currently NULL.

SET @now = UTC_TIMESTAMP(6);

CREATE TEMPORARY TABLE _group_heading_variants (
    param_name VARCHAR(160) NOT NULL,
    heading VARCHAR(120) NOT NULL,
    PRIMARY KEY (param_name)
);

INSERT INTO _group_heading_variants (param_name, heading) VALUES
    ('Blood Urea Nitrogen', 'Renal Function'),
    ('Blood Urea Nitrogen (BUN)', 'Renal Function'),
    ('Calcium, Total', 'Minerals'),
    ('Ionised Calcium', 'Minerals'),
    ('HCO3', 'Electrolytes'),
    ('RDW-CV', 'RBC Indices'),
    ('RDW-SD', 'RBC Indices'),
    ('MPV', 'Platelets'),
    ('PDW', 'Platelets'),
    ('Globulin', 'Proteins'),
    ('A:G Ratio', 'Proteins'),
    ('Albumin:Globulin Ratio', 'Proteins'),
    ('Indirect Bilirubin', 'Bilirubin'),
    ('Total Bilirubin (T. Bilirubin)', 'Bilirubin');

UPDATE parameter_master pm
JOIN _group_heading_variants m ON LOWER(pm.name) = LOWER(m.param_name)
SET pm.group_heading = m.heading, pm.updated_at = @now
WHERE pm.group_heading IS NULL;

UPDATE test_parameter tp
JOIN _group_heading_variants m ON LOWER(tp.name) = LOWER(m.param_name)
SET tp.group_heading = m.heading, tp.updated_at = @now
WHERE tp.group_heading IS NULL;

UPDATE master_test_parameter mtp
JOIN _group_heading_variants m ON LOWER(mtp.name) = LOWER(m.param_name)
SET mtp.group_heading = m.heading, mtp.updated_at = @now
WHERE mtp.group_heading IS NULL;

DROP TEMPORARY TABLE _group_heading_variants;
