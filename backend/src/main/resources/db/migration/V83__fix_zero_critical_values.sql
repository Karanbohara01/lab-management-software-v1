-- Fix legacy zero values for critical_low and critical_high that should be NULL.
-- In clinical laboratory medicine, a critical high is a panic alert value that is strictly
-- greater than the normal upper limit, and a critical low is strictly lower than the normal lower limit.
-- Blank inputs in the catalog modals were previously coerced to 0, which caused normal results
-- to be erroneously flagged as CRITICAL_HIGH.

UPDATE reference_range
SET critical_high = NULL
WHERE critical_high = 0 AND (high_value IS NULL OR high_value >= 0);

UPDATE reference_range
SET critical_low = NULL
WHERE critical_low = 0 AND (low_value IS NULL OR low_value <= 0);

UPDATE master_reference_range
SET critical_high = NULL
WHERE critical_high = 0 AND (high_value IS NULL OR high_value >= 0);

UPDATE master_reference_range
SET critical_low = NULL
WHERE critical_low = 0 AND (low_value IS NULL OR low_value <= 0);

UPDATE parameter_master
SET critical_high = NULL
WHERE critical_high = 0 AND (high_value IS NULL OR high_value >= 0);

UPDATE parameter_master
SET critical_low = NULL
WHERE critical_low = 0 AND (low_value IS NULL OR low_value <= 0);

-- Recalculate flags for existing numeric result_value rows that were falsely marked CRITICAL_HIGH or CRITICAL_LOW
UPDATE result_value rv
JOIN reference_range rr ON rr.test_parameter_id = rv.test_parameter_id
SET rv.flag = CASE
    WHEN rr.critical_low IS NOT NULL AND rr.critical_low > 0 AND rv.value_numeric < rr.critical_low THEN 'CRITICAL_LOW'
    WHEN rr.critical_high IS NOT NULL AND (rr.high_value IS NULL OR rr.critical_high > rr.high_value) AND rv.value_numeric > rr.critical_high THEN 'CRITICAL_HIGH'
    WHEN rr.low_value IS NOT NULL AND rv.value_numeric < rr.low_value THEN 'LOW'
    WHEN rr.high_value IS NOT NULL AND rv.value_numeric > rr.high_value THEN 'HIGH'
    ELSE 'NORMAL'
END
WHERE rv.data_type = 'NUMERIC' AND rv.value_numeric IS NOT NULL;

-- Update test_result flags based on updated result_value flags
UPDATE test_result tr
SET tr.has_critical = (
    SELECT COALESCE(MAX(CASE WHEN rv.flag IN ('CRITICAL_LOW', 'CRITICAL_HIGH') THEN 1 ELSE 0 END), 0)
    FROM result_value rv
    WHERE rv.test_result_id = tr.id
),
tr.has_abnormal = (
    SELECT COALESCE(MAX(CASE WHEN rv.flag IN ('LOW', 'HIGH', 'ABNORMAL', 'CRITICAL_LOW', 'CRITICAL_HIGH') THEN 1 ELSE 0 END), 0)
    FROM result_value rv
    WHERE rv.test_result_id = tr.id
),
tr.critical_ack_required = (
    SELECT COALESCE(MAX(CASE WHEN rv.flag IN ('CRITICAL_LOW', 'CRITICAL_HIGH') THEN 1 ELSE 0 END), 0)
    FROM result_value rv
    WHERE rv.test_result_id = tr.id
);
