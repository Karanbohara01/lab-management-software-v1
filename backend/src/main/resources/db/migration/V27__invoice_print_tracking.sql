-- ---------------------------------------------------------------------------
-- V27  Invoice print/reprint tracking, per the e-invoice procedure (दफा ६(च)):
--      a bill number may print as the ORIGINAL only once per fiscal year; any
--      further print of the same invoice must show a "Copy of Original"
--      watermark and how many times it has been reprinted must be tracked.
-- ---------------------------------------------------------------------------

ALTER TABLE invoice
    ADD COLUMN print_count      INT         NOT NULL DEFAULT 0,
    ADD COLUMN last_printed_at  DATETIME(6) NULL;
