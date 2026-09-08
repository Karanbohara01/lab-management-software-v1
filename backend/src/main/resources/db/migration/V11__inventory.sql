-- ---------------------------------------------------------------------------
-- V11  Inventory: suppliers, stock items, batches, stock movements, purchase orders.
-- ---------------------------------------------------------------------------

ALTER TABLE laboratory_profile
    ADD COLUMN inventory_expiry_alert_days INT NOT NULL DEFAULT 30 AFTER default_tax_rate;

INSERT INTO app_sequence (name, next_value) VALUES ('PURCHASE_ORDER', 1);

CREATE TABLE supplier (
    id             BIGINT       NOT NULL AUTO_INCREMENT,
    name           VARCHAR(200) NOT NULL,
    contact_person VARCHAR(160) NULL,
    phone          VARCHAR(48)  NULL,
    email          VARCHAR(160) NULL,
    address        VARCHAR(300) NULL,
    pan_number     VARCHAR(40)  NULL,
    active         TINYINT(1)   NOT NULL DEFAULT 1,
    version        BIGINT       NOT NULL DEFAULT 0,
    created_at     DATETIME(6)  NOT NULL,
    updated_at     DATETIME(6)  NOT NULL,
    created_by     VARCHAR(100) NULL,
    updated_by     VARCHAR(100) NULL,
    PRIMARY KEY (id),
    INDEX ix_supplier_name (name),
    INDEX ix_supplier_active (active)
) ENGINE = InnoDB;

CREATE TABLE inventory_item (
    id             BIGINT        NOT NULL AUTO_INCREMENT,
    code           VARCHAR(40)   NOT NULL,
    name           VARCHAR(200)  NOT NULL,
    category       VARCHAR(32)   NOT NULL,
    unit           VARCHAR(24)   NOT NULL,
    minimum_stock  DECIMAL(14,3) NOT NULL DEFAULT 0.000,
    department_id  BIGINT        NULL,
    notes          VARCHAR(1000) NULL,
    active         TINYINT(1)    NOT NULL DEFAULT 1,
    version        BIGINT        NOT NULL DEFAULT 0,
    created_at     DATETIME(6)   NOT NULL,
    updated_at     DATETIME(6)   NOT NULL,
    created_by     VARCHAR(100)  NULL,
    updated_by     VARCHAR(100)  NULL,
    PRIMARY KEY (id),
    CONSTRAINT uq_inventory_item_code UNIQUE (code),
    CONSTRAINT fk_inventory_item_department FOREIGN KEY (department_id) REFERENCES department (id),
    INDEX ix_inventory_item_name (name),
    INDEX ix_inventory_item_category (category)
) ENGINE = InnoDB;

CREATE TABLE inventory_batch (
    id                 BIGINT        NOT NULL AUTO_INCREMENT,
    inventory_item_id  BIGINT        NOT NULL,
    batch_number       VARCHAR(80)   NOT NULL,
    supplier_id        BIGINT        NULL,
    received_date      DATE          NOT NULL,
    expiry_date        DATE          NULL,
    initial_quantity   DECIMAL(14,3) NOT NULL,
    remaining_quantity DECIMAL(14,3) NOT NULL,
    unit_cost          DECIMAL(12,2) NULL,
    notes              VARCHAR(500)  NULL,
    version            BIGINT        NOT NULL DEFAULT 0,
    created_at         DATETIME(6)   NOT NULL,
    updated_at         DATETIME(6)   NOT NULL,
    created_by         VARCHAR(100)  NULL,
    updated_by         VARCHAR(100)  NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_inventory_batch_item     FOREIGN KEY (inventory_item_id) REFERENCES inventory_item (id) ON DELETE CASCADE,
    CONSTRAINT fk_inventory_batch_supplier FOREIGN KEY (supplier_id) REFERENCES supplier (id),
    CONSTRAINT ck_inventory_batch_remaining CHECK (remaining_quantity >= 0),
    INDEX ix_inventory_batch_item (inventory_item_id, expiry_date)
) ENGINE = InnoDB;

CREATE TABLE stock_transaction (
    id                 BIGINT        NOT NULL AUTO_INCREMENT,
    inventory_item_id  BIGINT        NOT NULL,
    inventory_batch_id BIGINT        NULL,
    type               VARCHAR(24)   NOT NULL,
    quantity           DECIMAL(14,3) NOT NULL,
    balance_after      DECIMAL(14,3) NOT NULL,
    reason             VARCHAR(300)  NULL,
    reference          VARCHAR(120)  NULL,
    performed_by       VARCHAR(100)  NOT NULL,
    occurred_at        DATETIME(6)   NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_stock_txn_item  FOREIGN KEY (inventory_item_id) REFERENCES inventory_item (id) ON DELETE CASCADE,
    CONSTRAINT fk_stock_txn_batch FOREIGN KEY (inventory_batch_id) REFERENCES inventory_batch (id),
    INDEX ix_stock_txn_item (inventory_item_id, occurred_at)
) ENGINE = InnoDB;

CREATE TABLE purchase_order (
    id             BIGINT        NOT NULL AUTO_INCREMENT,
    po_number      VARCHAR(24)   NOT NULL,
    supplier_id    BIGINT        NOT NULL,
    status         VARCHAR(24)   NOT NULL,
    expected_date  DATE          NULL,
    notes          VARCHAR(1000) NULL,
    submitted_at   DATETIME(6)   NULL,
    submitted_by   VARCHAR(100)  NULL,
    received_at    DATETIME(6)   NULL,
    received_by    VARCHAR(100)  NULL,
    cancelled_at   DATETIME(6)   NULL,
    cancel_reason  VARCHAR(500)  NULL,
    version        BIGINT        NOT NULL DEFAULT 0,
    created_at     DATETIME(6)   NOT NULL,
    updated_at     DATETIME(6)   NOT NULL,
    created_by     VARCHAR(100)  NULL,
    updated_by     VARCHAR(100)  NULL,
    PRIMARY KEY (id),
    CONSTRAINT uq_purchase_order_number UNIQUE (po_number),
    CONSTRAINT fk_purchase_order_supplier FOREIGN KEY (supplier_id) REFERENCES supplier (id),
    INDEX ix_purchase_order_status (status)
) ENGINE = InnoDB;

CREATE TABLE purchase_order_item (
    id                 BIGINT        NOT NULL AUTO_INCREMENT,
    purchase_order_id  BIGINT        NOT NULL,
    inventory_item_id  BIGINT        NOT NULL,
    item_code          VARCHAR(40)   NOT NULL,
    item_name          VARCHAR(200)  NOT NULL,
    unit               VARCHAR(24)   NOT NULL,
    quantity_ordered   DECIMAL(14,3) NOT NULL,
    quantity_received  DECIMAL(14,3) NOT NULL DEFAULT 0.000,
    estimated_unit_cost DECIMAL(12,2) NULL,
    version            BIGINT        NOT NULL DEFAULT 0,
    created_at         DATETIME(6)   NOT NULL,
    updated_at         DATETIME(6)   NOT NULL,
    created_by         VARCHAR(100)  NULL,
    updated_by         VARCHAR(100)  NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_po_item_order FOREIGN KEY (purchase_order_id) REFERENCES purchase_order (id) ON DELETE CASCADE,
    CONSTRAINT fk_po_item_item  FOREIGN KEY (inventory_item_id) REFERENCES inventory_item (id),
    INDEX ix_po_item_order (purchase_order_id)
) ENGINE = InnoDB;
