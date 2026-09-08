-- ---------------------------------------------------------------------------
-- V9  Billing: invoices, invoice items, payments and refunds.
--     Invoice numbers are per-fiscal-year; the fiscal year label is configurable.
-- ---------------------------------------------------------------------------

ALTER TABLE laboratory_profile
    ADD COLUMN fiscal_year      VARCHAR(16)  NOT NULL DEFAULT '2082/83' AFTER pan_number,
    ADD COLUMN invoice_prefix   VARCHAR(16)  NOT NULL DEFAULT 'INV'     AFTER fiscal_year,
    ADD COLUMN default_tax_rate DECIMAL(6,3) NOT NULL DEFAULT 0.000     AFTER invoice_prefix;

CREATE TABLE invoice (
    id                 BIGINT        NOT NULL AUTO_INCREMENT,
    invoice_number     VARCHAR(32)   NULL,
    fiscal_year        VARCHAR(16)   NOT NULL,
    lab_order_id       BIGINT        NOT NULL,
    patient_id         BIGINT        NOT NULL,
    status             VARCHAR(24)   NOT NULL,

    subtotal           DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    discount_type      VARCHAR(16)   NOT NULL DEFAULT 'NONE',
    discount_value     DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    discount_amount    DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    taxable_amount     DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    tax_rate           DECIMAL(6,3)  NOT NULL DEFAULT 0.000,
    tax_amount         DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_amount       DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    amount_paid        DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    amount_refunded    DECIMAL(12,2) NOT NULL DEFAULT 0.00,

    issued_at          DATETIME(6)   NULL,
    issued_by          VARCHAR(100)  NULL,
    cancelled_at       DATETIME(6)   NULL,
    cancelled_by       VARCHAR(100)  NULL,
    cancel_reason      VARCHAR(500)  NULL,
    notes              VARCHAR(1000) NULL,

    version            BIGINT        NOT NULL DEFAULT 0,
    created_at         DATETIME(6)   NOT NULL,
    updated_at         DATETIME(6)   NOT NULL,
    created_by         VARCHAR(100)  NULL,
    updated_by         VARCHAR(100)  NULL,
    PRIMARY KEY (id),
    CONSTRAINT uq_invoice_order  UNIQUE (lab_order_id),
    CONSTRAINT uq_invoice_number UNIQUE (invoice_number),
    CONSTRAINT fk_invoice_order   FOREIGN KEY (lab_order_id) REFERENCES lab_order (id),
    CONSTRAINT fk_invoice_patient FOREIGN KEY (patient_id)   REFERENCES patient (id),
    INDEX ix_invoice_status (status),
    INDEX ix_invoice_patient (patient_id),
    INDEX ix_invoice_created_at (created_at)
) ENGINE = InnoDB;

CREATE TABLE invoice_item (
    id             BIGINT        NOT NULL AUTO_INCREMENT,
    invoice_id     BIGINT        NOT NULL,
    test_code      VARCHAR(32)   NOT NULL,
    test_name      VARCHAR(160)  NOT NULL,
    unit_price     DECIMAL(12,2) NOT NULL,
    quantity       INT           NOT NULL DEFAULT 1,
    line_discount  DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    line_total     DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    version        BIGINT        NOT NULL DEFAULT 0,
    created_at     DATETIME(6)   NOT NULL,
    updated_at     DATETIME(6)   NOT NULL,
    created_by     VARCHAR(100)  NULL,
    updated_by     VARCHAR(100)  NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_invoice_item_invoice FOREIGN KEY (invoice_id) REFERENCES invoice (id) ON DELETE CASCADE,
    INDEX ix_invoice_item_invoice (invoice_id)
) ENGINE = InnoDB;

CREATE TABLE payment (
    id              BIGINT        NOT NULL AUTO_INCREMENT,
    invoice_id      BIGINT        NOT NULL,
    amount          DECIMAL(12,2) NOT NULL,
    method          VARCHAR(24)   NOT NULL,
    reference       VARCHAR(120)  NULL,
    note            VARCHAR(500)  NULL,
    received_by     VARCHAR(100)  NOT NULL,
    received_at     DATETIME(6)   NOT NULL,
    reversed        TINYINT(1)    NOT NULL DEFAULT 0,
    version         BIGINT        NOT NULL DEFAULT 0,
    created_at      DATETIME(6)   NOT NULL,
    updated_at      DATETIME(6)   NOT NULL,
    created_by      VARCHAR(100)  NULL,
    updated_by      VARCHAR(100)  NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_payment_invoice FOREIGN KEY (invoice_id) REFERENCES invoice (id),
    CONSTRAINT ck_payment_amount CHECK (amount > 0),
    INDEX ix_payment_invoice (invoice_id)
) ENGINE = InnoDB;

CREATE TABLE refund (
    id              BIGINT        NOT NULL AUTO_INCREMENT,
    invoice_id      BIGINT        NOT NULL,
    payment_id      BIGINT        NULL,
    amount          DECIMAL(12,2) NOT NULL,
    reason          VARCHAR(500)  NOT NULL,
    status          VARCHAR(24)   NOT NULL,
    requested_by    VARCHAR(100)  NOT NULL,
    requested_at    DATETIME(6)   NOT NULL,
    decided_by      VARCHAR(100)  NULL,
    decided_at      DATETIME(6)   NULL,
    decision_note   VARCHAR(500)  NULL,
    version         BIGINT        NOT NULL DEFAULT 0,
    created_at      DATETIME(6)   NOT NULL,
    updated_at      DATETIME(6)   NOT NULL,
    created_by      VARCHAR(100)  NULL,
    updated_by      VARCHAR(100)  NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_refund_invoice FOREIGN KEY (invoice_id) REFERENCES invoice (id),
    CONSTRAINT fk_refund_payment FOREIGN KEY (payment_id) REFERENCES payment (id),
    CONSTRAINT ck_refund_amount CHECK (amount > 0),
    INDEX ix_refund_invoice (invoice_id),
    INDEX ix_refund_status (status)
) ENGINE = InnoDB;
