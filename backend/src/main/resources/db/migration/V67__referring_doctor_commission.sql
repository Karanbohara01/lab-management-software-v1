-- Referring-doctor commission: each doctor can have a commission rate (% of the taxable amount,
-- i.e. pre-VAT lab revenue — not the tax itself) on invoices from orders they referred. Earned
-- automatically when an invoice is issued (see CommissionService/InvoiceService). commission_entry
-- rows are an immutable earned-record ledger; commission_payout rows are separate settlement
-- payments — outstanding per doctor is simply sum(entries) - sum(payouts), not a 1:1 match between
-- a payout and specific entries (a lab typically pays a lump sum periodically, not per-invoice).

ALTER TABLE doctor
    ADD COLUMN commission_rate DECIMAL(5,2) NULL AFTER affiliated_organization;

CREATE TABLE commission_entry (
    id                  BIGINT        NOT NULL AUTO_INCREMENT,
    organization_id     BIGINT        NOT NULL,
    doctor_id           BIGINT        NOT NULL,
    invoice_id          BIGINT        NOT NULL,
    invoice_number      VARCHAR(40)   NOT NULL,
    order_id            BIGINT        NOT NULL,
    order_number        VARCHAR(40)   NOT NULL,
    base_amount         DECIMAL(12,2) NOT NULL,
    rate                DECIMAL(5,2)  NOT NULL,
    commission_amount   DECIMAL(12,2) NOT NULL,
    earned_at           DATETIME(6)   NOT NULL,
    version             BIGINT        NOT NULL DEFAULT 0,
    created_at          DATETIME(6)   NOT NULL,
    updated_at          DATETIME(6)   NOT NULL,
    created_by          VARCHAR(100)  NULL,
    updated_by          VARCHAR(100)  NULL,
    PRIMARY KEY (id),
    CONSTRAINT uq_commission_entry_invoice UNIQUE (invoice_id),
    CONSTRAINT fk_commission_entry_doctor FOREIGN KEY (doctor_id) REFERENCES doctor (id),
    CONSTRAINT fk_commission_entry_invoice FOREIGN KEY (invoice_id) REFERENCES invoice (id),
    INDEX ix_commission_entry_doctor (organization_id, doctor_id, earned_at)
) ENGINE = InnoDB;

CREATE TABLE commission_payout (
    id                  BIGINT        NOT NULL AUTO_INCREMENT,
    organization_id     BIGINT        NOT NULL,
    doctor_id           BIGINT        NOT NULL,
    amount              DECIMAL(12,2) NOT NULL,
    method              VARCHAR(24)   NOT NULL,
    reference           VARCHAR(120)  NULL,
    note                VARCHAR(500)  NULL,
    paid_at             DATETIME(6)   NOT NULL,
    paid_by             VARCHAR(100)  NOT NULL,
    version             BIGINT        NOT NULL DEFAULT 0,
    created_at          DATETIME(6)   NOT NULL,
    updated_at          DATETIME(6)   NOT NULL,
    created_by          VARCHAR(100)  NULL,
    updated_by          VARCHAR(100)  NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_commission_payout_doctor FOREIGN KEY (doctor_id) REFERENCES doctor (id),
    INDEX ix_commission_payout_doctor (organization_id, doctor_id, paid_at)
) ENGINE = InnoDB;

INSERT INTO permission (name, description, created_at, updated_at, created_by, updated_by) VALUES
 ('COMMISSION_READ','View referring-doctor commission earnings and payouts',NOW(6),NOW(6),'system','system'),
 ('COMMISSION_MANAGE','Set doctor commission rates and record commission payouts',NOW(6),NOW(6),'system','system');

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM role r JOIN permission p
WHERE p.name IN ('COMMISSION_READ', 'COMMISSION_MANAGE')
  AND r.name IN ('SUPER_ADMIN', 'LAB_ADMINISTRATOR');
