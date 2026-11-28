-- V93: Doctor E-Prescriptions and Direct Dispense Queue

CREATE TABLE IF NOT EXISTS `pharmacy_prescription` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `organization_id` BIGINT NOT NULL DEFAULT 1,
    `prescription_number` VARCHAR(60) NOT NULL UNIQUE,
    `patient_id` BIGINT NULL,
    `patient_name` VARCHAR(160) NOT NULL,
    `patient_mrn` VARCHAR(60) NULL,
    `patient_phone` VARCHAR(40) NULL,
    `doctor_id` BIGINT NULL,
    `doctor_name` VARCHAR(160) NOT NULL,
    `doctor_nmc` VARCHAR(50) NULL,
    `department` VARCHAR(100) NULL, -- 'OPD', 'EMERGENCY', 'ICU', 'CARDIOLOGY'
    `diagnosis` VARCHAR(255) NULL,
    `status` VARCHAR(40) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'PARTIALLY_DISPENSED', 'COMPLETED', 'CANCELLED'
    `valid_until` DATE NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME NOT NULL,
    `created_by` VARCHAR(100) NOT NULL,
    `updated_at` DATETIME NOT NULL,
    `updated_by` VARCHAR(100) NOT NULL,
    `version` BIGINT NOT NULL DEFAULT 0,
    INDEX `idx_presc_patient` (`patient_id`),
    INDEX `idx_presc_doctor` (`doctor_id`),
    INDEX `idx_presc_status` (`status`),
    INDEX `idx_presc_number` (`prescription_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `pharmacy_prescription_item` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `prescription_id` BIGINT NOT NULL,
    `item_id` BIGINT NOT NULL,
    `item_name` VARCHAR(200) NOT NULL,
    `generic_name` VARCHAR(250) NULL,
    `dosage` VARCHAR(100) NOT NULL, -- '1-0-1 After Food'
    `frequency` VARCHAR(60) NULL, -- 'Twice Daily'
    `duration_days` INT NOT NULL DEFAULT 5,
    `quantity_prescribed` INT NOT NULL,
    `quantity_dispensed` INT NOT NULL DEFAULT 0,
    `unit_type` VARCHAR(40) NOT NULL DEFAULT 'UNIT', -- 'PACK' or 'UNIT'
    `instructions` VARCHAR(255) NULL,
    CONSTRAINT `fk_presc_item_prescription` FOREIGN KEY (`prescription_id`) REFERENCES `pharmacy_prescription` (`id`) ON DELETE CASCADE,
    INDEX `idx_presc_item_medicine` (`item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
