-- ---------------------------------------------------------------------------
-- V29  Track who last printed an invoice — the "Printed_by" field the
--      e-invoice procedure's Anusuchi-5 master-bill report requires, which
--      print_count/last_printed_at (V27) didn't capture.
-- ---------------------------------------------------------------------------

ALTER TABLE invoice
    ADD COLUMN last_printed_by VARCHAR(100) NULL AFTER last_printed_at;
