-- ---------------------------------------------------------------------------
-- V5  Lab orders and order items (financial totals are snapshotted on the order).
-- ---------------------------------------------------------------------------

INSERT INTO app_sequence (name, next_value) VALUES ('ORDER_NUMBER', 1);

CREATE TABLE lab_order (
    id                    BIGINT        NOT NULL AUTO_INCREMENT,
    order_number          VARCHAR(24)   NOT NULL,
    patient_id            BIGINT        NOT NULL,
    referring_doctor_id   BIGINT        NULL,
    status                VARCHAR(24)   NOT NULL,
    clinical_notes        VARCHAR(1000) NULL,
    ordered_at            DATETIME(6)   NOT NULL,
    confirmed_at          DATETIME(6)   NULL,
    cancelled_at          DATETIME(6)   NULL,
    cancel_reason         VARCHAR(500)  NULL,

    subtotal              DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    discount_type         VARCHAR(16)   NOT NULL DEFAULT 'NONE',
    discount_value        DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    discount_amount       DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    taxable_amount        DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    tax_rate              DECIMAL(6,3)  NOT NULL DEFAULT 0.000,
    tax_amount            DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_amount          DECIMAL(12,2) NOT NULL DEFAULT 0.00,

    version               BIGINT        NOT NULL DEFAULT 0,
    created_at            DATETIME(6)   NOT NULL,
    updated_at            DATETIME(6)   NOT NULL,
    created_by            VARCHAR(100)  NULL,
    updated_by            VARCHAR(100)  NULL,
    PRIMARY KEY (id),
    CONSTRAINT uq_lab_order_number UNIQUE (order_number),
    CONSTRAINT fk_lab_order_patient FOREIGN KEY (patient_id) REFERENCES patient (id),
    CONSTRAINT fk_lab_order_doctor  FOREIGN KEY (referring_doctor_id) REFERENCES doctor (id),
    INDEX ix_lab_order_patient (patient_id),
    INDEX ix_lab_order_status (status),
    INDEX ix_lab_order_ordered_at (ordered_at)
) ENGINE = InnoDB;

CREATE TABLE lab_order_item (
    id                 BIGINT        NOT NULL AUTO_INCREMENT,
    lab_order_id       BIGINT        NOT NULL,
    lab_test_id        BIGINT        NOT NULL,
    test_code          VARCHAR(32)   NOT NULL,
    test_name          VARCHAR(160)  NOT NULL,
    department_name    VARCHAR(120)  NOT NULL,
    unit_price         DECIMAL(12,2) NOT NULL,
    quantity           INT           NOT NULL DEFAULT 1,
    line_discount      DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    line_total         DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    status             VARCHAR(24)   NOT NULL DEFAULT 'PENDING',
    version            BIGINT        NOT NULL DEFAULT 0,
    created_at         DATETIME(6)   NOT NULL,
    updated_at         DATETIME(6)   NOT NULL,
    created_by         VARCHAR(100)  NULL,
    updated_by         VARCHAR(100)  NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_order_item_order FOREIGN KEY (lab_order_id) REFERENCES lab_order (id) ON DELETE CASCADE,
    CONSTRAINT fk_order_item_test  FOREIGN KEY (lab_test_id) REFERENCES lab_test (id),
    CONSTRAINT ck_order_item_qty CHECK (quantity >= 1),
    INDEX ix_order_item_order (lab_order_id)
) ENGINE = InnoDB;
