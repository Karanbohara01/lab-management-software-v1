-- Phase 1 of real multi-tenant data isolation: give the highest-value/highest-risk tables
-- (accounts, locations, departments, patients) a real organization_id boundary, enforced at the
-- Hibernate session level via a `tenantFilter` (see np.com.lims.common.tenant.TenantContext),
-- not left to every query author to remember. Remaining tables (orders, samples, results,
-- reports, invoices, inventory, notifications...) follow the exact same pattern in a later pass —
-- deliberately not all at once, so each slice can be verified in isolation before the next.
--
-- All of TODAY's existing data is backfilled into one "primary" organization — nothing about the
-- single-tenant behavior this app has always had changes for the existing installation; this
-- migration only makes the tenant boundary explicit and ready for a second real tenant to be
-- added safely later.

INSERT INTO organization (slug, name, contact_email, status, version, created_at, updated_at, created_by, updated_by)
SELECT 'primary', COALESCE((SELECT name FROM laboratory_profile WHERE id = 1), 'Primary Clinic'),
       NULL, 'ACTIVE', 0, NOW(6), NOW(6), 'system', 'system'
WHERE NOT EXISTS (SELECT 1 FROM organization WHERE slug = 'primary');

INSERT INTO subscription (organization_id, plan_id, status, started_at, note, version, created_at, updated_at, created_by, updated_by)
SELECT o.id, p.id, 'ACTIVE', NOW(6), 'Existing installation, migrated into the tenant model', 0, NOW(6), NOW(6), 'system', 'system'
FROM organization o, subscription_plan p
WHERE o.slug = 'primary' AND p.code = 'ENTERPRISE'
  AND NOT EXISTS (SELECT 1 FROM subscription s WHERE s.organization_id = o.id);

-- ----- app_user -----------------------------------------------------------

ALTER TABLE app_user ADD COLUMN organization_id BIGINT NULL AFTER id;
UPDATE app_user SET organization_id = (SELECT id FROM organization WHERE slug = 'primary') WHERE organization_id IS NULL;
ALTER TABLE app_user MODIFY organization_id BIGINT NOT NULL;
ALTER TABLE app_user ADD CONSTRAINT fk_app_user_org FOREIGN KEY (organization_id) REFERENCES organization(id);
ALTER TABLE app_user DROP INDEX uq_user_username;
ALTER TABLE app_user DROP INDEX uq_user_email;
ALTER TABLE app_user ADD CONSTRAINT uq_user_username UNIQUE (organization_id, username);
ALTER TABLE app_user ADD CONSTRAINT uq_user_email UNIQUE (organization_id, email);

-- ----- branch ---------------------------------------------------------------

ALTER TABLE branch ADD COLUMN organization_id BIGINT NULL AFTER id;
UPDATE branch SET organization_id = (SELECT id FROM organization WHERE slug = 'primary') WHERE organization_id IS NULL;
ALTER TABLE branch MODIFY organization_id BIGINT NOT NULL;
ALTER TABLE branch ADD CONSTRAINT fk_branch_org FOREIGN KEY (organization_id) REFERENCES organization(id);
ALTER TABLE branch DROP INDEX uq_branch_code;
ALTER TABLE branch ADD CONSTRAINT uq_branch_code UNIQUE (organization_id, code);

-- ----- department -------------------------------------------------------------

ALTER TABLE department ADD COLUMN organization_id BIGINT NULL AFTER id;
UPDATE department SET organization_id = (SELECT id FROM organization WHERE slug = 'primary') WHERE organization_id IS NULL;
ALTER TABLE department MODIFY organization_id BIGINT NOT NULL;
ALTER TABLE department ADD CONSTRAINT fk_department_org FOREIGN KEY (organization_id) REFERENCES organization(id);
ALTER TABLE department DROP INDEX uq_department_code;
ALTER TABLE department ADD CONSTRAINT uq_department_code UNIQUE (organization_id, code);

-- ----- patient ------------------------------------------------------------

ALTER TABLE patient ADD COLUMN organization_id BIGINT NULL AFTER id;
UPDATE patient SET organization_id = (SELECT id FROM organization WHERE slug = 'primary') WHERE organization_id IS NULL;
ALTER TABLE patient MODIFY organization_id BIGINT NOT NULL;
ALTER TABLE patient ADD CONSTRAINT fk_patient_org FOREIGN KEY (organization_id) REFERENCES organization(id);
ALTER TABLE patient DROP INDEX uq_patient_mrn;
ALTER TABLE patient ADD CONSTRAINT uq_patient_mrn UNIQUE (organization_id, mrn);
CREATE INDEX idx_patient_org ON patient(organization_id);

-- ----- patient_identifier ---------------------------------------------------
-- Has its own repository with direct cross-patient lookups (find-by-identifier-value), so it
-- carries its own organization_id rather than relying solely on a join through patient.

ALTER TABLE patient_identifier ADD COLUMN organization_id BIGINT NULL AFTER id;
UPDATE patient_identifier pi
JOIN patient p ON pi.patient_id = p.id
SET pi.organization_id = p.organization_id
WHERE pi.organization_id IS NULL;
ALTER TABLE patient_identifier MODIFY organization_id BIGINT NOT NULL;
ALTER TABLE patient_identifier ADD CONSTRAINT fk_patient_identifier_org FOREIGN KEY (organization_id) REFERENCES organization(id);
CREATE INDEX idx_patient_identifier_org ON patient_identifier(organization_id);
