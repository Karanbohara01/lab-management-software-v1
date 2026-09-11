-- ---------------------------------------------------------------------------
-- V30  Online payment gateway tracking (eSewa / Khalti). An OnlinePayment row
--      tracks one checkout attempt against an invoice; on server-verified
--      success it results in a normal Payment record (method DIGITAL_WALLET)
--      via the existing Invoice.recordPayment(), so billing logic (balance,
--      payment status, refunds) is completely unaware this came from a
--      gateway rather than a cashier — it's just another payment.
-- ---------------------------------------------------------------------------

CREATE TABLE online_payment (
    id                       BIGINT       NOT NULL AUTO_INCREMENT,
    invoice_id               BIGINT       NOT NULL,
    provider                 VARCHAR(24)  NOT NULL,
    status                   VARCHAR(24)  NOT NULL,
    amount                   DECIMAL(12,2) NOT NULL,
    transaction_uuid         VARCHAR(120) NOT NULL,
    provider_reference       VARCHAR(120) NULL,
    payment_id               BIGINT       NULL,
    initiated_at             DATETIME(6)  NOT NULL,
    initiated_by             VARCHAR(100) NOT NULL,
    verified_at              DATETIME(6)  NULL,
    failure_reason           VARCHAR(500) NULL,
    initiate_response        JSON         NULL,
    verify_response          JSON         NULL,
    version                  BIGINT       NOT NULL DEFAULT 0,
    created_at               DATETIME(6)  NOT NULL,
    updated_at               DATETIME(6)  NOT NULL,
    created_by                VARCHAR(100) NULL,
    updated_by                VARCHAR(100) NULL,
    PRIMARY KEY (id),
    CONSTRAINT uq_online_payment_txn UNIQUE (transaction_uuid),
    CONSTRAINT fk_online_payment_invoice FOREIGN KEY (invoice_id) REFERENCES invoice (id),
    CONSTRAINT fk_online_payment_payment FOREIGN KEY (payment_id) REFERENCES payment (id),
    INDEX ix_online_payment_invoice (invoice_id),
    INDEX ix_online_payment_status (status)
) ENGINE = InnoDB;
