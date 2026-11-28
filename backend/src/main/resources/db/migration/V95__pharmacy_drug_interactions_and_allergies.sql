-- V95: Clinical Drug-Drug Interactions (DDI) & Patient Drug Allergy Guardrails

CREATE TABLE IF NOT EXISTS `pharmacy_drug_interaction` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `organization_id` BIGINT NOT NULL DEFAULT 1,
    `drug_a_generic` VARCHAR(150) NOT NULL,
    `drug_b_generic` VARCHAR(150) NOT NULL,
    `severity` VARCHAR(40) NOT NULL DEFAULT 'MODERATE_MONITOR', -- 'SEVERE_CONTRAINDICATED', 'MODERATE_MONITOR', 'MINOR_INFORMATIONAL'
    `interaction_title` VARCHAR(255) NOT NULL,
    `clinical_effect` TEXT NOT NULL,
    `recommendation` TEXT NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` DATETIME NOT NULL,
    `created_by` VARCHAR(100) NOT NULL,
    `updated_at` DATETIME NOT NULL,
    `updated_by` VARCHAR(100) NOT NULL,
    `version` BIGINT NOT NULL DEFAULT 0,
    INDEX `idx_ddi_drug_a` (`drug_a_generic`),
    INDEX `idx_ddi_drug_b` (`drug_b_generic`),
    INDEX `idx_ddi_severity` (`severity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `pharmacy_patient_allergy` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `organization_id` BIGINT NOT NULL DEFAULT 1,
    `patient_id` BIGINT NOT NULL,
    `allergen_generic` VARCHAR(150) NOT NULL,
    `severity` VARCHAR(40) NOT NULL DEFAULT 'SEVERE', -- 'MILD', 'MODERATE', 'SEVERE', 'ANAPHYLACTIC'
    `reaction_details` VARCHAR(255) NULL,
    `created_at` DATETIME NOT NULL,
    `created_by` VARCHAR(100) NOT NULL,
    `updated_at` DATETIME NOT NULL,
    `updated_by` VARCHAR(100) NOT NULL,
    `version` BIGINT NOT NULL DEFAULT 0,
    INDEX `idx_allergy_patient` (`patient_id`),
    INDEX `idx_allergy_generic` (`allergen_generic`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Clinical High-Risk Drug-Drug Interaction Pairs (WHO / BNF / DDA standards)
INSERT INTO `pharmacy_drug_interaction` 
(`organization_id`, `drug_a_generic`, `drug_b_generic`, `severity`, `interaction_title`, `clinical_effect`, `recommendation`, `created_at`, `created_by`, `updated_at`, `updated_by`)
VALUES
(1, 'WARFARIN', 'ASPIRIN', 'SEVERE_CONTRAINDICATED', 
 'Critical Bleeding & Hemorrhage Risk', 
 'Co-administration dramatically enhances anticoagulant effect and platelet inhibition, substantially increasing major GI and intracranial bleeding risks.', 
 'Contraindicated for general pain relief. Replace Aspirin with Paracetamol. If dual therapy is clinically required by cardiology, prescribe mandatory PPI and monitor INR closely.', NOW(), 'SYSTEM', NOW(), 'SYSTEM'),

(1, 'WARFARIN', 'IBUPROFEN', 'SEVERE_CONTRAINDICATED', 
 'Severe GI Ulceration & Hemorrhagic Risk', 
 'NSAIDs displace Warfarin from protein-binding sites and cause direct mucosal irritation, leading to severe gastrointestinal bleeding.', 
 'Avoid combination. Recommend alternative analgesia (Paracetamol) or consult prescribing physician.', NOW(), 'SYSTEM', NOW(), 'SYSTEM'),

(1, 'CIPROFLOXACIN', 'CALCIUM CARBONATE', 'MODERATE_MONITOR', 
 'Reduced Fluoroquinolone Bioavailability', 
 'Polyvalent cations (Calcium, Iron, Magnesium, Antacids) chelate with Ciprofloxacin in the gut, reducing antibiotic absorption by up to 85%.', 
 'Instruct patient to administer Ciprofloxacin at least 2 hours before or 6 hours after calcium or antacid supplements.', NOW(), 'SYSTEM', NOW(), 'SYSTEM'),

(1, 'AZITHROMYCIN', 'ONDANSETRON', 'SEVERE_CONTRAINDICATED', 
 'Additive QTc Prolongation & Torsades de Pointes', 
 'Concurrent use may lead to additive prolongation of the cardiac QT interval, posing a life-threatening risk of ventricular arrhythmias.', 
 'Avoid co-dispensing in patients with cardiac risk factors. Use Metoclopramide or alternate antiemetic, or select an alternative antibiotic.', NOW(), 'SYSTEM', NOW(), 'SYSTEM'),

(1, 'METHOTREXATE', 'IBUPROFEN', 'SEVERE_CONTRAINDICATED', 
 'Severe Methotrexate Toxicity & Pancytopenia', 
 'NSAIDs reduce renal clearance of Methotrexate, precipitating bone marrow suppression, severe mucosal toxicity, and renal impairment.', 
 'Strictly avoid combination without oncology / rheumatology protocol oversight.', NOW(), 'SYSTEM', NOW(), 'SYSTEM'),

(1, 'ENALAPRIL', 'SPIRONOLACTONE', 'MODERATE_MONITOR', 
 'Synergistic Hyperkalemia Risk', 
 'Combined inhibition of the renin-angiotensin-aldosterone axis causes excessive serum potassium retention, potentially triggering arrhythmias.', 
 'Monitor serum potassium and renal parameters within 7-14 days of initiating combination therapy.', NOW(), 'SYSTEM', NOW(), 'SYSTEM'),

(1, 'METFORMIN', 'CIPROFLOXACIN', 'MODERATE_MONITOR', 
 'Severe Hypoglycemia & Glycemic Fluctuation', 
 'Fluoroquinolones may unpredictably interfere with glucose homeostasis, triggering acute hypoglycemia in diabetic patients taking Metformin.', 
 'Counsel patient to monitor blood glucose more frequently during antibiotic therapy and report tremors or dizziness immediately.', NOW(), 'SYSTEM', NOW(), 'SYSTEM'),

(1, 'PARACETAMOL', 'TRAMADOL', 'MINOR_INFORMATIONAL', 
 'Synergistic Analgesia (Safe Combination)', 
 'Complementary central and peripheral analgesic mechanisms provide enhanced pain control at reduced individual doses.', 
 'Safe and commonly prescribed combination. Verify total daily Paracetamol does not exceed 4,000 mg (4g) from all sources.', NOW(), 'SYSTEM', NOW(), 'SYSTEM');
