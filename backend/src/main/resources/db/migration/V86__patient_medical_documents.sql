-- Medical records & clinical document attachments for patients
-- Allows clinics to attach prescriptions, external reports, referral notes, insurance cards, and imaging
CREATE TABLE patient_document (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    organization_id BIGINT NOT NULL,
    patient_id BIGINT NOT NULL,
    title VARCHAR(180) NOT NULL,
    document_type VARCHAR(40) NOT NULL,
    document_date DATE NULL,
    doctor_or_facility VARCHAR(180) NULL,
    notes TEXT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    file_data LONGBLOB NOT NULL,
    uploaded_by VARCHAR(100) NOT NULL,
    uploaded_at DATETIME(6) NOT NULL,
    deleted TINYINT(1) NOT NULL DEFAULT 0,
    deleted_at DATETIME(6) NULL,
    deleted_by VARCHAR(100) NULL,
    version BIGINT NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    created_by VARCHAR(100) NULL,
    updated_by VARCHAR(100) NULL,
    CONSTRAINT fk_patient_doc_patient FOREIGN KEY (patient_id) REFERENCES patient(id) ON DELETE CASCADE,
    INDEX idx_patient_doc_org_pat (organization_id, patient_id),
    INDEX idx_patient_doc_type (organization_id, document_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
