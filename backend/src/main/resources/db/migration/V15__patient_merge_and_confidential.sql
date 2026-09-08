-- ---------------------------------------------------------------------------
-- V15  Patient merge (combine duplicate records) and confidential-record
--      access control.
-- ---------------------------------------------------------------------------

ALTER TABLE patient
    ADD COLUMN merged_into_id BIGINT       NULL,
    ADD COLUMN merged_at      DATETIME(6)  NULL,
    ADD COLUMN merged_by      VARCHAR(100) NULL,
    ADD CONSTRAINT fk_patient_merged_into FOREIGN KEY (merged_into_id) REFERENCES patient (id);

CREATE INDEX ix_patient_merged_into ON patient (merged_into_id);

-- New permissions -----------------------------------------------------------
INSERT INTO permission (name, description, created_at, updated_at, created_by, updated_by) VALUES
 ('PATIENT_CONFIDENTIAL','View patient records flagged confidential',NOW(6),NOW(6),'system','system'),
 ('PATIENT_MERGE','Merge duplicate patient records',NOW(6),NOW(6),'system','system');

-- Grants ------------------------------------------------------------------
-- PATIENT_CONFIDENTIAL → SUPER_ADMIN, LAB_ADMINISTRATOR, PATHOLOGIST
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
JOIN permission p ON p.name = 'PATIENT_CONFIDENTIAL'
WHERE r.name IN ('SUPER_ADMIN', 'LAB_ADMINISTRATOR', 'PATHOLOGIST')
  AND NOT EXISTS (SELECT 1 FROM role_permission rp WHERE rp.role_id = r.id AND rp.permission_id = p.id);

-- PATIENT_MERGE → SUPER_ADMIN, LAB_ADMINISTRATOR
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
JOIN permission p ON p.name = 'PATIENT_MERGE'
WHERE r.name IN ('SUPER_ADMIN', 'LAB_ADMINISTRATOR')
  AND NOT EXISTS (SELECT 1 FROM role_permission rp WHERE rp.role_id = r.id AND rp.permission_id = p.id);
