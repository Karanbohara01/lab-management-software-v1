-- ---------------------------------------------------------------------------
-- V19  Result-entry intelligence: order/result priority (STAT), turnaround
--      due-dates, delta checks against a patient's previous result, and
--      rule-based auto-verification.
-- ---------------------------------------------------------------------------

ALTER TABLE lab_order
    ADD COLUMN priority VARCHAR(12) NOT NULL DEFAULT 'ROUTINE';

ALTER TABLE test_result
    ADD COLUMN priority      VARCHAR(12) NOT NULL DEFAULT 'ROUTINE',
    ADD COLUMN due_at        DATETIME(6) NULL,
    ADD COLUMN auto_verified TINYINT(1)  NOT NULL DEFAULT 0;

CREATE INDEX ix_test_result_due_at ON test_result (due_at);

ALTER TABLE lab_test
    ADD COLUMN auto_verify_enabled TINYINT(1) NOT NULL DEFAULT 0;

ALTER TABLE test_parameter
    ADD COLUMN delta_check_percent DECIMAL(6,2) NULL;

ALTER TABLE result_value
    ADD COLUMN previous_value DECIMAL(16,4) NULL,
    ADD COLUMN delta_percent  DECIMAL(8,2)  NULL,
    ADD COLUMN delta_breach   TINYINT(1)    NOT NULL DEFAULT 0,
    ADD COLUMN comment        VARCHAR(300)  NULL;
