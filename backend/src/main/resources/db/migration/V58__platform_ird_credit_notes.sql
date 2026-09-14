-- Enterprise-hardening pass on platform subscription-invoice IRD billing: credit notes for
-- cancelled invoices that were already filed (mirrors ird_submission's credit-note columns,
-- V26), a cancel reason/timestamp on subscription_invoice itself (SubscriptionInvoice.cancel()
-- existed but was never wired to anything until now), and a transport-vs-rejected flag on the
-- last failure so the auto-retry sweep only ever retries a real transport failure, never a bill
-- IRD itself rejected.

ALTER TABLE subscription_invoice
    ADD COLUMN cancel_reason VARCHAR(500) NULL AFTER pending_transaction_uuid,
    ADD COLUMN cancelled_at  DATETIME(6)  NULL AFTER cancel_reason;

ALTER TABLE platform_ird_submission
    ADD COLUMN last_failure_transmitted TINYINT(1)  NULL AFTER last_error_message,
    ADD COLUMN cancelled_at             DATETIME(6) NULL AFTER accepted_at,
    ADD COLUMN credit_note_status       VARCHAR(24) NOT NULL DEFAULT 'NOT_NEEDED' AFTER cancelled_at,
    ADD COLUMN credit_note_number       VARCHAR(120) NULL AFTER credit_note_status,
    ADD COLUMN credit_note_filed_at     DATETIME(6) NULL AFTER credit_note_number,
    ADD COLUMN credit_note_error_code   VARCHAR(64) NULL AFTER credit_note_filed_at,
    ADD COLUMN credit_note_error_message VARCHAR(500) NULL AFTER credit_note_error_code,
    ADD INDEX idx_platform_ird_submission_credit_note_status (credit_note_status);
