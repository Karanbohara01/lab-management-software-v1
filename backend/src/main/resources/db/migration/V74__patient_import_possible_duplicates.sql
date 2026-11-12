-- ---------------------------------------------------------------------------
-- V74  Possible duplicates in the patient import.
--
--      A row that only shares a name, gender and age with an existing patient
--      is not a match the system can act on by itself: two people called Ram
--      Thapa, both 40, are common. Nor is it something to import silently. It
--      gets its own tier, counted here so the progress and summary screens can
--      show it beside the firm matches, and its own policy at confirmation.
-- ---------------------------------------------------------------------------

ALTER TABLE patient_import_job
    ADD COLUMN possible_duplicate_rows INT NOT NULL DEFAULT 0 AFTER duplicate_rows;
