-- V92: Narcotics & Controlled Schedule H / G Drug Register (DDA Nepal Compliance)

DROP TABLE IF EXISTS `pharmacy_narcotic_log`;

CREATE TABLE IF NOT EXISTS `pharmacy_narcotic_log` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `organization_id` BIGINT NOT NULL DEFAULT 1,
    `item_id` BIGINT NOT NULL,
    `batch_id` BIGINT NOT NULL,
    `sale_id` BIGINT NULL,
    `sale_item_id` BIGINT NULL,
    `log_date` DATETIME NOT NULL,
    `patient_id` BIGINT NULL,
    `patient_name` VARCHAR(150) NOT NULL,
    `patient_age_gender` VARCHAR(50) NULL,
    `patient_address` VARCHAR(255) NULL,
    `buyer_name` VARCHAR(150) NOT NULL,
    `buyer_relation` VARCHAR(100) NULL,
    `buyer_contact` VARCHAR(50) NULL,
    `buyer_id_type` VARCHAR(50) NULL, -- 'CITIZENSHIP', 'NATIONAL_ID', 'DRIVING_LICENSE', 'PASSPORT'
    `buyer_id_number` VARCHAR(100) NULL,
    `doctor_id` BIGINT NULL,
    `doctor_name` VARCHAR(150) NOT NULL,
    `doctor_nmc_number` VARCHAR(50) NOT NULL, -- Nepal Medical Council Reg No.
    `prescription_number` VARCHAR(100) NULL,
    `prescription_date` DATE NULL,
    `dispensed_quantity` INT NOT NULL,
    `unit_type` VARCHAR(50) NOT NULL DEFAULT 'UNIT',
    `balance_stock_units` INT NOT NULL,
    `pharmacist_name` VARCHAR(150) NOT NULL,
    `pharmacist_npc_number` VARCHAR(50) NULL, -- Nepal Pharmacy Council Reg No.
    `remarks` TEXT NULL,
    `created_at` DATETIME NOT NULL,
    `created_by` VARCHAR(100) NOT NULL,
    `updated_at` DATETIME NOT NULL,
    `updated_by` VARCHAR(100) NOT NULL,
    `version` BIGINT NOT NULL DEFAULT 0,
    INDEX `idx_narcotic_item` (`item_id`),
    INDEX `idx_narcotic_batch` (`batch_id`),
    INDEX `idx_narcotic_sale` (`sale_id`),
    INDEX `idx_narcotic_date` (`log_date`),
    INDEX `idx_narcotic_doctor_nmc` (`doctor_nmc_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add narcotic / controlled substance flag & schedule classification to pharmacy_item
ALTER TABLE `pharmacy_item`
    ADD COLUMN `is_narcotic` BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN `requires_prescription` BOOLEAN NOT NULL DEFAULT FALSE;
