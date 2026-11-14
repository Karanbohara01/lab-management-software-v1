-- ---------------------------------------------------------------------------
-- V77  Snapshot the order's priority onto its samples, the way test_result
--      already does — collection/receiving queues currently have no way to
--      tell a STAT draw from a routine one.
-- ---------------------------------------------------------------------------

ALTER TABLE sample
    ADD COLUMN priority VARCHAR(12) NOT NULL DEFAULT 'ROUTINE';
