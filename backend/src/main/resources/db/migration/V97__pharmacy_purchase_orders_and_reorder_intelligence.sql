-- V97: Enterprise Pharmacy Purchase Orders & Smart Re-Order Intelligence
CREATE TABLE IF NOT EXISTS pharmacy_purchase_order (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    organization_id BIGINT NOT NULL,
    po_number VARCHAR(60) NOT NULL,
    wholesaler_id BIGINT NOT NULL,
    order_date DATE NOT NULL,
    expected_delivery_date DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    total_estimated_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    received_purchase_id BIGINT,
    INDEX idx_pharm_po_tenant (organization_id),
    INDEX idx_pharm_po_number (po_number),
    INDEX idx_pharm_po_wholesaler (wholesaler_id),
    INDEX idx_pharm_po_status (status),
    CONSTRAINT fk_pharm_po_wholesaler FOREIGN KEY (wholesaler_id) REFERENCES pharmacy_wholesaler(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pharmacy_purchase_order_item (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    purchase_order_id BIGINT NOT NULL,
    item_id BIGINT NOT NULL,
    pack_unit VARCHAR(30) NOT NULL DEFAULT 'STRIP',
    pack_size INT NOT NULL DEFAULT 10,
    recommended_pack_qty INT NOT NULL DEFAULT 1,
    ordered_pack_qty INT NOT NULL DEFAULT 1,
    received_pack_qty INT NOT NULL DEFAULT 0,
    estimated_rate_per_pack DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    estimated_total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    remarks VARCHAR(255),
    INDEX idx_pharm_po_item_po (purchase_order_id),
    INDEX idx_pharm_po_item_drug (item_id),
    CONSTRAINT fk_pharm_poi_order FOREIGN KEY (purchase_order_id) REFERENCES pharmacy_purchase_order(id) ON DELETE CASCADE,
    CONSTRAINT fk_pharm_poi_item FOREIGN KEY (item_id) REFERENCES pharmacy_item(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
