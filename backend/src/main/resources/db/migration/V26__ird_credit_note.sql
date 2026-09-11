-- ---------------------------------------------------------------------------
-- V26  IRD / CBMS credit notes (POST /api/billreturn).
--
--      Cancelling an invoice that was already successfully filed with IRD
--      (status ACCEPTED/DUPLICATE) must eventually be reversed there via a
--      credit note — otherwise IRD keeps a filed bill on record that no
--      longer matches reality. Filing that credit note is a separate,
--      explicit, staff-triggered action (never automatic on cancel — the
--      same "never let a slow/failing external call block billing" rule
--      that already governs bill submission itself). onInvoiceCancelled()
--      only flags credit_note_status = NEEDED; nothing is transmitted until
--      staff explicitly submits it from the IRD submission screen.
-- ---------------------------------------------------------------------------

ALTER TABLE ird_submission
    ADD COLUMN credit_note_status       VARCHAR(24)  NOT NULL DEFAULT 'NOT_NEEDED' AFTER status,
    ADD COLUMN credit_note_number       VARCHAR(120) NULL,
    ADD COLUMN credit_note_filed_at     DATETIME(6)  NULL,
    ADD COLUMN credit_note_error_code   VARCHAR(64)  NULL,
    ADD COLUMN credit_note_error_message VARCHAR(500) NULL;

CREATE INDEX ix_ird_submission_credit_note_status ON ird_submission (credit_note_status);
