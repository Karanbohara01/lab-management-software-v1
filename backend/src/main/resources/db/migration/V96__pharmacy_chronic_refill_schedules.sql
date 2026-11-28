-- V96: Chronic Patient Medication Refill Tracker & Automated SMS Engine

CREATE TABLE IF NOT EXISTS `pharmacy_refill_schedule` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `organization_id` BIGINT NOT NULL DEFAULT 1,
    `patient_id` BIGINT NULL,
    `patient_name` VARCHAR(150) NOT NULL,
    `patient_phone` VARCHAR(40) NOT NULL,
    `sale_id` BIGINT NULL,
    `invoice_number` VARCHAR(60) NULL,
    `item_id` BIGINT NOT NULL,
    `item_name` VARCHAR(200) NOT NULL,
    `dispensed_quantity` INT NOT NULL,
    `unit_type` VARCHAR(40) NOT NULL DEFAULT 'UNIT',
    `dosage_instruction` VARCHAR(150) NULL,
    `dispensed_date` DATE NOT NULL,
    `course_days` INT NOT NULL DEFAULT 30,
    `refill_due_date` DATE NOT NULL,
    `status` VARCHAR(40) NOT NULL DEFAULT 'SCHEDULED', -- 'SCHEDULED', 'REMINDER_SENT', 'REFILLED', 'LAPSED'
    `last_reminder_sent_at` DATETIME NULL,
    `reminder_count` INT NOT NULL DEFAULT 0,
    `notes` TEXT NULL,
    `created_at` DATETIME NOT NULL,
    `created_by` VARCHAR(100) NOT NULL,
    `updated_at` DATETIME NOT NULL,
    `updated_by` VARCHAR(100) NOT NULL,
    `version` BIGINT NOT NULL DEFAULT 0,
    INDEX `idx_refill_org` (`organization_id`),
    INDEX `idx_refill_patient` (`patient_id`),
    INDEX `idx_refill_due_date` (`refill_due_date`),
    INDEX `idx_refill_status` (`status`),
    INDEX `idx_refill_phone` (`patient_phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Sample Chronic Disease Refill Patients for Outpatient OPD
INSERT INTO `pharmacy_refill_schedule`
(`organization_id`, `patient_name`, `patient_phone`, `invoice_number`, `item_id`, `item_name`, `dispensed_quantity`, `unit_type`, `dosage_instruction`, `dispensed_date`, `course_days`, `refill_due_date`, `status`, `reminder_count`, `notes`, `created_at`, `created_by`, `updated_at`, `updated_by`)
VALUES
(1, 'Gopal Prasad Sharma', '9841234567', 'PHARM-202611-1021', 1, 'Metformin 500mg SR', 60, 'UNIT', '1 Tab BD after food', DATE_SUB(CURDATE(), INTERVAL 27 DAY), 30, CURDATE(), 'SCHEDULED', 0, 'Type 2 Diabetes Mellitus - Regular Monthly Refill', NOW(), 'SYSTEM', NOW(), 'SYSTEM'),

(1, 'Sita Maya Tamang', '9808765432', 'PHARM-202611-1045', 2, 'Amlodipine 5mg', 30, 'UNIT', '1 Tab OD morning', DATE_SUB(CURDATE(), INTERVAL 25 DAY), 30, DATE_ADD(CURDATE(), INTERVAL 2 DAY), 'SCHEDULED', 0, 'Essential Hypertension - Dr. Rajesh Shrestha OPD', NOW(), 'SYSTEM', NOW(), 'SYSTEM'),

(1, 'Hari Bahadur Khadka', '9851122334', 'PHARM-202611-0988', 3, 'Thyronorm 50mcg (Thyroxine)', 100, 'UNIT', '1 Tab OD empty stomach', DATE_SUB(CURDATE(), INTERVAL 95 DAY), 90, DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'REMINDER_SENT', 1, 'Hypothyroidism - 3 Month Maintenance Course (Overdue)', NOW(), 'SYSTEM', NOW(), 'SYSTEM');
