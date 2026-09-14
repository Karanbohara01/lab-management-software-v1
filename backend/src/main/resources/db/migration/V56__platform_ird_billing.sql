-- Platform-admin IRD-verified billing for SUBSCRIPTION invoices — what this deployment charges a
-- clinic for its own plan, as opposed to np.com.lims.ird/ird_submission, which is entirely about a
-- CLINIC filing ITS OWN patient invoices with IRD. Mirrors that same CBMS submission lifecycle
-- (see np.com.lims.ird.gateway.IrdGateway, reused unchanged) but scoped to subscription_invoice and
-- deliberately NOT tenant-filtered — a subscription invoice belongs to the platform operator, not
-- any one clinic's dataset, exactly like subscription_invoice itself (see its own migration V46).

ALTER TABLE organization
    ADD COLUMN pan VARCHAR(20) NULL AFTER city;

-- subscription_invoice.amount is, and remains, the exact NPR figure charged via eSewa — that
-- charging behaviour is unchanged by this migration. taxable_amount/tax_amount/total_amount are
-- the VAT-inclusive breakdown of that SAME figure (total_amount = amount, taxable = amount / 1.13,
-- tax = the remainder) purely for IRD e-billing purposes, not a price change.
ALTER TABLE subscription_invoice
    ADD COLUMN taxable_amount DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER amount,
    ADD COLUMN tax_amount     DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER taxable_amount,
    ADD COLUMN total_amount   DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER tax_amount;

UPDATE subscription_invoice
SET total_amount   = amount,
    taxable_amount = ROUND(amount / 1.13, 2),
    tax_amount     = amount - ROUND(amount / 1.13, 2)
WHERE total_amount = 0;

CREATE TABLE platform_ird_submission (
    id                      BIGINT       NOT NULL AUTO_INCREMENT,
    subscription_invoice_id BIGINT       NOT NULL,
    status                  VARCHAR(24)  NOT NULL DEFAULT 'NOT_SUBMITTED',
    provider_reference      VARCHAR(120) NULL,
    last_error_code         VARCHAR(64)  NULL,
    last_error_message      VARCHAR(500) NULL,
    attempt_count           INT          NOT NULL DEFAULT 0,
    manual                  TINYINT(1)   NOT NULL DEFAULT 0,
    manual_reference        VARCHAR(120) NULL,
    notes                   VARCHAR(1000) NULL,
    request_snapshot        JSON         NULL,
    response_snapshot       JSON         NULL,
    submitted_at            DATETIME(6)  NULL,
    accepted_at             DATETIME(6)  NULL,
    version                 BIGINT       NOT NULL DEFAULT 0,
    created_at              DATETIME(6)  NOT NULL,
    updated_at              DATETIME(6)  NOT NULL,
    created_by              VARCHAR(100) NULL,
    updated_by              VARCHAR(100) NULL,
    PRIMARY KEY (id),
    CONSTRAINT uq_platform_ird_submission_invoice UNIQUE (subscription_invoice_id),
    CONSTRAINT fk_platform_ird_submission_invoice FOREIGN KEY (subscription_invoice_id) REFERENCES subscription_invoice(id) ON DELETE CASCADE,
    INDEX idx_platform_ird_submission_status (status)
) ENGINE = InnoDB;

-- Backfill a tracking row for every subscription invoice already issued before this migration, same
-- as V53-style historical backfill — otherwise older invoices would have no IRD row to submit from.
INSERT INTO platform_ird_submission (subscription_invoice_id, status, created_at, updated_at)
SELECT id, 'NOT_SUBMITTED', UTC_TIMESTAMP(6), UTC_TIMESTAMP(6) FROM subscription_invoice;
