-- Recurring platform billing: one row per billing period per organization. Deliberately NOT
-- tenant-filtered at the Hibernate level (same as organization/subscription/subscription_plan) —
-- this is platform registry data, not clinic-owned operational data. Clinic-facing queries scope
-- explicitly by organization_id instead (see SubscriptionBillingService).
CREATE TABLE subscription_invoice (
    id                       BIGINT       NOT NULL AUTO_INCREMENT,
    organization_id          BIGINT       NOT NULL,
    subscription_id          BIGINT       NOT NULL,
    plan_code                VARCHAR(40)  NOT NULL,
    plan_name                VARCHAR(120) NOT NULL,
    amount                   DECIMAL(12,2) NOT NULL,
    period_start             DATETIME(6)  NOT NULL,
    period_end               DATETIME(6)  NOT NULL,
    due_at                   DATETIME(6)  NOT NULL,
    status                   VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    paid_at                  DATETIME(6)  NULL,
    payment_reference        VARCHAR(200) NULL,
    pending_transaction_uuid VARCHAR(80)  NULL,
    version                  BIGINT       NOT NULL DEFAULT 0,
    created_at               DATETIME(6)  NOT NULL,
    updated_at               DATETIME(6)  NOT NULL,
    created_by               VARCHAR(100) NULL,
    updated_by               VARCHAR(100) NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_subscription_invoice_org FOREIGN KEY (organization_id) REFERENCES organization(id),
    CONSTRAINT fk_subscription_invoice_sub FOREIGN KEY (subscription_id) REFERENCES subscription(id),
    INDEX idx_subscription_invoice_org (organization_id),
    INDEX idx_subscription_invoice_status_due (status, due_at)
) ENGINE = InnoDB;
