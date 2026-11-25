-- ====================================================================
-- Flyway Migration: V91__pharmacy_returns_and_credit_notes.sql
-- Module: Hospital Pharmacy Returns, IRD Nepal Credit Notes (Anusuchi-7)
-- and Wholesaler Debit Notes
-- ====================================================================

-- 1. Alter pharmacy_sale_item to track returned quantities
ALTER TABLE pharmacy_sale_item
  ADD COLUMN returned_quantity INT NOT NULL DEFAULT 0,
  ADD COLUMN returned_units INT NOT NULL DEFAULT 0;

-- 2. Alter pharmacy_sale to track total returned amount and status
ALTER TABLE pharmacy_sale
  ADD COLUMN returned_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN return_status VARCHAR(30) NOT NULL DEFAULT 'NONE';

-- 3. Customer Sales Returns / Credit Notes (फिर्ता बिल) Table
CREATE TABLE pharmacy_sale_return (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    organization_id BIGINT NOT NULL,
    credit_note_number VARCHAR(60) NOT NULL,
    sale_id BIGINT NOT NULL,
    original_invoice_number VARCHAR(60) NOT NULL,
    customer_name VARCHAR(160) NOT NULL,
    customer_phone VARCHAR(40),
    patient_id BIGINT,
    return_reason VARCHAR(60) NOT NULL,
    refund_method VARCHAR(30) NOT NULL DEFAULT 'CASH',
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    taxable_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    non_taxable_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    vat_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    net_refund_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    notes VARCHAR(500),
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    version BIGINT DEFAULT 0,
    CONSTRAINT fk_sale_return_org FOREIGN KEY (organization_id) REFERENCES organization(id),
    CONSTRAINT fk_sale_return_sale FOREIGN KEY (sale_id) REFERENCES pharmacy_sale(id),
    CONSTRAINT fk_sale_return_patient FOREIGN KEY (patient_id) REFERENCES patient(id),
    INDEX idx_sale_return_org (organization_id),
    INDEX idx_sale_return_cn (credit_note_number),
    INDEX idx_sale_return_invoice (original_invoice_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Customer Sales Return Items Table
CREATE TABLE pharmacy_sale_return_item (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sale_return_id BIGINT NOT NULL,
    sale_item_id BIGINT NOT NULL,
    item_id BIGINT NOT NULL,
    batch_id BIGINT NOT NULL,
    unit_type VARCHAR(20) NOT NULL DEFAULT 'UNIT',
    return_quantity INT NOT NULL,
    units_restored INT NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    is_vat_applicable BOOLEAN NOT NULL DEFAULT FALSE,
    vat_percentage DECIMAL(5,2) DEFAULT 0.00,
    vat_amount DECIMAL(12,2) DEFAULT 0.00,
    total_refund DECIMAL(12,2) NOT NULL,
    CONSTRAINT fk_ret_item_return FOREIGN KEY (sale_return_id) REFERENCES pharmacy_sale_return(id) ON DELETE CASCADE,
    CONSTRAINT fk_ret_item_sale_item FOREIGN KEY (sale_item_id) REFERENCES pharmacy_sale_item(id),
    CONSTRAINT fk_ret_item_item FOREIGN KEY (item_id) REFERENCES pharmacy_item(id),
    CONSTRAINT fk_ret_item_batch FOREIGN KEY (batch_id) REFERENCES pharmacy_batch(id),
    INDEX idx_ret_item_return (sale_return_id),
    INDEX idx_ret_item_batch (batch_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Wholesaler Supplier Expiry / Debit Notes Table
CREATE TABLE pharmacy_supplier_return (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    organization_id BIGINT NOT NULL,
    debit_note_number VARCHAR(60) NOT NULL,
    wholesaler_id BIGINT NOT NULL,
    wholesaler_name VARCHAR(160) NOT NULL,
    return_date DATE NOT NULL,
    reason VARCHAR(60) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    notes VARCHAR(500),
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    version BIGINT DEFAULT 0,
    CONSTRAINT fk_sup_return_org FOREIGN KEY (organization_id) REFERENCES organization(id),
    CONSTRAINT fk_sup_return_ws FOREIGN KEY (wholesaler_id) REFERENCES pharmacy_wholesaler(id),
    INDEX idx_sup_return_org (organization_id),
    INDEX idx_sup_return_dn (debit_note_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Wholesaler Supplier Return Items Table
CREATE TABLE pharmacy_supplier_return_item (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    supplier_return_id BIGINT NOT NULL,
    item_id BIGINT NOT NULL,
    batch_id BIGINT NOT NULL,
    batch_number VARCHAR(60) NOT NULL,
    expiry_date DATE NOT NULL,
    pack_quantity INT NOT NULL,
    rate_per_pack DECIMAL(12,2) NOT NULL,
    line_total DECIMAL(12,2) NOT NULL,
    CONSTRAINT fk_sup_ret_item_ret FOREIGN KEY (supplier_return_id) REFERENCES pharmacy_supplier_return(id) ON DELETE CASCADE,
    CONSTRAINT fk_sup_ret_item_item FOREIGN KEY (item_id) REFERENCES pharmacy_item(id),
    CONSTRAINT fk_sup_ret_item_batch FOREIGN KEY (batch_id) REFERENCES pharmacy_batch(id),
    INDEX idx_sup_ret_item_ret (supplier_return_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
