-- =====================================================================
-- V90: Hospital-Grade Pharmacy Module (MediPro / MIDAS standard)
-- =====================================================================

-- 1. Pharmacy Item Master (Medicines, Skincare, Surgicals, Nutraceuticals)
CREATE TABLE pharmacy_item (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    version BIGINT DEFAULT 0,
    organization_id BIGINT NOT NULL,
    name VARCHAR(200) NOT NULL,
    generic_name VARCHAR(250),
    category VARCHAR(50) NOT NULL DEFAULT 'ALLOPATHIC',
    dosage_form VARCHAR(50) NOT NULL DEFAULT 'TABLET',
    strength VARCHAR(80),
    manufacturer VARCHAR(150),
    pack_unit VARCHAR(30) NOT NULL DEFAULT 'STRIP',
    dispensing_unit VARCHAR(30) NOT NULL DEFAULT 'TAB',
    pack_size INT NOT NULL DEFAULT 10,
    hs_code VARCHAR(30) DEFAULT '3004.90.00',
    is_vat_applicable BOOLEAN NOT NULL DEFAULT FALSE,
    vat_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    schedule VARCHAR(30) DEFAULT 'SCHEDULE_H',
    rack_location VARCHAR(80),
    min_stock_level INT DEFAULT 10,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    barcode VARCHAR(80),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    INDEX idx_pharm_item_org (organization_id),
    INDEX idx_pharm_item_name (name),
    INDEX idx_pharm_item_generic (generic_name),
    INDEX idx_pharm_item_barcode (barcode)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Pharmacy Wholesalers / Suppliers (Distributors with DDA Reg)
CREATE TABLE pharmacy_wholesaler (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    version BIGINT DEFAULT 0,
    organization_id BIGINT NOT NULL,
    name VARCHAR(180) NOT NULL,
    contact_person VARCHAR(120),
    phone VARCHAR(40),
    email VARCHAR(120),
    address VARCHAR(250),
    pan_vat_number VARCHAR(50),
    dda_registration_no VARCHAR(80),
    credit_period_days INT DEFAULT 30,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    INDEX idx_pharm_wholesaler_org (organization_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Pharmacy Resellers / Institutional Bulk Buyers
CREATE TABLE pharmacy_reseller (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    version BIGINT DEFAULT 0,
    organization_id BIGINT NOT NULL,
    name VARCHAR(180) NOT NULL,
    contact_person VARCHAR(120),
    phone VARCHAR(40),
    email VARCHAR(120),
    address VARCHAR(250),
    pan_vat_number VARCHAR(50),
    discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    credit_limit DECIMAL(12,2) DEFAULT 0.00,
    current_balance DECIMAL(12,2) DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    INDEX idx_pharm_reseller_org (organization_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Pharmacy Batches (FEFO Stock tracking at Base Unit level)
CREATE TABLE pharmacy_batch (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    version BIGINT DEFAULT 0,
    organization_id BIGINT NOT NULL,
    item_id BIGINT NOT NULL,
    wholesaler_id BIGINT,
    batch_number VARCHAR(80) NOT NULL,
    mfg_date DATE,
    expiry_date DATE NOT NULL,
    pack_size INT NOT NULL DEFAULT 10,
    initial_units INT NOT NULL,
    remaining_units INT NOT NULL,
    purchase_rate_per_pack DECIMAL(12,2) NOT NULL,
    effective_cost_per_unit DECIMAL(12,4) NOT NULL,
    mrp_per_pack DECIMAL(12,2) NOT NULL,
    unit_mrp DECIMAL(12,2) NOT NULL,
    wholesale_rate_per_pack DECIMAL(12,2),
    rack_location VARCHAR(80),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    FOREIGN KEY (item_id) REFERENCES pharmacy_item(id) ON DELETE CASCADE,
    FOREIGN KEY (wholesaler_id) REFERENCES pharmacy_wholesaler(id) ON DELETE SET NULL,
    INDEX idx_pharm_batch_org (organization_id),
    INDEX idx_pharm_batch_item (item_id),
    INDEX idx_pharm_batch_exp (expiry_date),
    INDEX idx_pharm_batch_no (batch_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Pharmacy Purchases (Inward GRN with Carrier Charges, Bonus & Schemes)
CREATE TABLE pharmacy_purchase (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    version BIGINT DEFAULT 0,
    organization_id BIGINT NOT NULL,
    purchase_number VARCHAR(60) NOT NULL,
    wholesaler_id BIGINT NOT NULL,
    wholesaler_invoice_no VARCHAR(80) NOT NULL,
    invoice_date DATE NOT NULL,
    received_date DATE NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    carrier_charges DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    other_charges DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    taxable_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    non_taxable_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    vat_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    net_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    payment_status VARCHAR(30) NOT NULL DEFAULT 'UNPAID',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    FOREIGN KEY (wholesaler_id) REFERENCES pharmacy_wholesaler(id),
    INDEX idx_pharm_purch_org (organization_id),
    INDEX idx_pharm_purch_no (purchase_number),
    INDEX idx_pharm_purch_wholesaler (wholesaler_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Pharmacy Purchase Items (Billed vs Free/Bonus Qty, Rates, Tax)
CREATE TABLE pharmacy_purchase_item (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    purchase_id BIGINT NOT NULL,
    item_id BIGINT NOT NULL,
    batch_id BIGINT,
    batch_number VARCHAR(80) NOT NULL,
    mfg_date DATE,
    expiry_date DATE NOT NULL,
    pack_size INT NOT NULL DEFAULT 10,
    billed_pack_qty INT NOT NULL,
    free_pack_qty INT NOT NULL DEFAULT 0,
    purchase_rate_per_pack DECIMAL(12,2) NOT NULL,
    discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    discount_amount DECIMAL(12,2) DEFAULT 0.00,
    is_vat_applicable BOOLEAN NOT NULL DEFAULT FALSE,
    vat_percentage DECIMAL(5,2) DEFAULT 0.00,
    vat_amount DECIMAL(12,2) DEFAULT 0.00,
    mrp_per_pack DECIMAL(12,2) NOT NULL,
    wholesale_rate_per_pack DECIMAL(12,2),
    line_total DECIMAL(12,2) NOT NULL,
    effective_unit_cost DECIMAL(12,4) NOT NULL,
    FOREIGN KEY (purchase_id) REFERENCES pharmacy_purchase(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES pharmacy_item(id),
    FOREIGN KEY (batch_id) REFERENCES pharmacy_batch(id) ON DELETE SET NULL,
    INDEX idx_pharm_purch_item_purch (purchase_id),
    INDEX idx_pharm_purch_item_item (item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Pharmacy Sales / Dispensing (POS Counter & Reseller Wholesale)
CREATE TABLE pharmacy_sale (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    version BIGINT DEFAULT 0,
    organization_id BIGINT NOT NULL,
    invoice_number VARCHAR(60) NOT NULL,
    sale_type VARCHAR(30) NOT NULL DEFAULT 'RETAIL',
    patient_id BIGINT,
    customer_name VARCHAR(160) NOT NULL,
    customer_phone VARCHAR(40),
    doctor_id BIGINT,
    doctor_name VARCHAR(160),
    reseller_id BIGINT,
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    taxable_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    non_taxable_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    vat_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    net_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    change_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(40) NOT NULL DEFAULT 'CASH',
    status VARCHAR(30) NOT NULL DEFAULT 'COMPLETED',
    refill_reminder_days INT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    FOREIGN KEY (patient_id) REFERENCES patient(id) ON DELETE SET NULL,
    FOREIGN KEY (doctor_id) REFERENCES doctor(id) ON DELETE SET NULL,
    FOREIGN KEY (reseller_id) REFERENCES pharmacy_reseller(id) ON DELETE SET NULL,
    INDEX idx_pharm_sale_org (organization_id),
    INDEX idx_pharm_sale_inv (invoice_number),
    INDEX idx_pharm_sale_pat (patient_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Pharmacy Sale Items (Strip/Tab dual unit sale, dosages, tax)
CREATE TABLE pharmacy_sale_item (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sale_id BIGINT NOT NULL,
    item_id BIGINT NOT NULL,
    batch_id BIGINT NOT NULL,
    unit_type VARCHAR(20) NOT NULL DEFAULT 'UNIT',
    quantity INT NOT NULL,
    units_deducted INT NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    discount_amount DECIMAL(12,2) DEFAULT 0.00,
    is_vat_applicable BOOLEAN NOT NULL DEFAULT FALSE,
    vat_percentage DECIMAL(5,2) DEFAULT 0.00,
    vat_amount DECIMAL(12,2) DEFAULT 0.00,
    total_price DECIMAL(12,2) NOT NULL,
    dosage_instruction VARCHAR(160),
    FOREIGN KEY (sale_id) REFERENCES pharmacy_sale(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES pharmacy_item(id),
    FOREIGN KEY (batch_id) REFERENCES pharmacy_batch(id),
    INDEX idx_pharm_sale_item_sale (sale_id),
    INDEX idx_pharm_sale_item_batch (batch_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Seed Sample Master Data for Testing and Immediate Usability
INSERT INTO pharmacy_item (organization_id, name, generic_name, category, dosage_form, strength, manufacturer, pack_unit, dispensing_unit, pack_size, hs_code, is_vat_applicable, vat_percentage, schedule, rack_location, min_stock_level) VALUES
(1, 'Azithral 500', 'Azithromycin', 'ALLOPATHIC', 'TABLET', '500mg', 'Alembic Pharmaceuticals', 'STRIP', 'TAB', 5, '3004.90.00', FALSE, 0.00, 'SCHEDULE_H', 'Rack A-1', 15),
(1, 'Pantocid 40', 'Pantoprazole Sodium', 'ALLOPATHIC', 'TABLET', '40mg', 'Sun Pharma', 'STRIP', 'TAB', 15, '3004.90.00', FALSE, 0.00, 'SCHEDULE_H', 'Rack A-2', 30),
(1, 'Paracetamol 500', 'Paracetamol', 'ALLOPATHIC', 'TABLET', '500mg', 'Nepal Pharmaceuticals', 'STRIP', 'TAB', 10, '3004.90.00', FALSE, 0.00, 'OTC', 'Rack B-1', 50),
(1, 'Cetaphil Gentle Skin Cleanser', 'Gentle Skin Cleanser', 'SKINCARE', 'LOTION', '125ml', 'Galderma', 'BOTTLE', 'BOTTLE', 1, '3304.99.00', TRUE, 13.00, 'OTC', 'Derma Shelf 1', 5),
(1, 'Photostable Sunscreen Gel SPF 55', 'Sunscreen Gel SPF 55+', 'SKINCARE', 'GEL', '50g', 'Sun Pharma Derma', 'TUBE', 'TUBE', 1, '3304.99.00', TRUE, 13.00, 'OTC', 'Derma Shelf 1', 5),
(1, 'Sterile Surgical Bandage Roll', 'Absorbent Cotton Gauze', 'SURGICAL', 'BANDAGE', '10cm x 5m', 'Himalayan Health', 'PIECE', 'PIECE', 1, '3005.10.00', TRUE, 13.00, 'GENERAL', 'Surgical Shelf S', 20);

INSERT INTO pharmacy_wholesaler (organization_id, name, contact_person, phone, email, address, pan_vat_number, dda_registration_no, credit_period_days) VALUES
(1, 'Himalayan Pharma Distributors', 'Ramesh Sharma', '9841234567', 'himalayan@pharma.com.np', 'Tripureshwor, Kathmandu', '300123456', 'DDA-D-1029', 30),
(1, 'National Derma & Med Supplies', 'Suman Shrestha', '9851098765', 'derma@nationalmed.np', 'Chabahil, Kathmandu', '600987654', 'DDA-D-3044', 45);

INSERT INTO pharmacy_reseller (organization_id, name, contact_person, phone, email, address, pan_vat_number, discount_percentage, credit_limit, current_balance) VALUES
(1, 'Lalitpur Health Post Dispensary', 'Dr. P. Maharjan', '9801122334', 'dispensary@lalitpur.org', 'Patan, Lalitpur', '601234567', 8.50, 150000.00, 12500.00),
(1, 'City Care PolyClinic Pharmacy', 'Anil Joshi', '9841998877', 'citycare@gmail.com', 'Pulchowk, Lalitpur', '602345678', 10.00, 200000.00, 0.00);

-- Initial sample batches for instant stock & FEFO testing
INSERT INTO pharmacy_batch (organization_id, item_id, wholesaler_id, batch_number, mfg_date, expiry_date, pack_size, initial_units, remaining_units, purchase_rate_per_pack, effective_cost_per_unit, mrp_per_pack, unit_mrp, wholesale_rate_per_pack, rack_location) VALUES
(1, 1, 1, 'AZ-2026A', '2026-01-10', '2027-12-31', 5, 100, 100, 120.00, 24.00, 175.00, 35.00, 140.00, 'Rack A-1'),
(1, 2, 1, 'PAN-99B', '2026-02-15', '2028-01-31', 15, 300, 300, 95.00, 6.33, 145.00, 9.67, 115.00, 'Rack A-2'),
(1, 3, 1, 'PCM-01', '2026-03-01', '2028-06-30', 10, 500, 500, 12.00, 1.20, 20.00, 2.00, 15.00, 'Rack B-1'),
(1, 4, 2, 'CET-401', '2026-04-01', '2027-08-31', 1, 20, 20, 520.00, 520.00, 690.00, 690.00, 580.00, 'Derma Shelf 1'),
(1, 5, 2, 'SUN-88X', '2026-05-10', '2027-04-30', 1, 30, 30, 640.00, 640.00, 850.00, 850.00, 720.00, 'Derma Shelf 1');


-- 10. Seed RBAC Permissions for Pharmacy
INSERT INTO permission (name, description, created_at, updated_at, created_by, updated_by) VALUES
('PHARMACY_READ', 'View pharmacy inventory, batches, and sales', NOW(6), NOW(6), 'system', 'system'),
('PHARMACY_DISPENSE', 'Dispense medicines and issue counter pharmacy receipts', NOW(6), NOW(6), 'system', 'system'),
('PHARMACY_MANAGE', 'Manage pharmacy purchases, pricing, wholesalers, and resellers', NOW(6), NOW(6), 'system', 'system');

-- Grant to SUPER_ADMIN and LAB_ADMINISTRATOR, and grant DISPENSE/READ to RECEPTIONIST
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM role r JOIN permission p 
WHERE r.name IN ('SUPER_ADMIN', 'LAB_ADMINISTRATOR') 
  AND p.name IN ('PHARMACY_READ', 'PHARMACY_DISPENSE', 'PHARMACY_MANAGE');

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM role r JOIN permission p 
WHERE r.name = 'RECEPTIONIST' 
  AND p.name IN ('PHARMACY_READ', 'PHARMACY_DISPENSE');
