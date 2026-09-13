-- Phase 1 of tenant isolation, slice 5: audit_log, qc_material, qc_run, critical_value_callback,
-- result_comment_template — every remaining table with its own standalone repository query.
-- Same pattern as before. `audit_log` deliberately never leaking across tenants matters most here
-- — it's the security/compliance trail, and every action any tenant's staff takes must stay
-- invisible to every other tenant, including platform-level admins browsing via /audit-logs.
--
-- Deliberately NOT touched in this slice:
--  - backup_run: a database backup file is a full-instance SQL dump covering every organization
--    at once, not a per-tenant artifact — scoping it per-org would be actively misleading (it
--    would look tenant-scoped but the underlying .sql.gz file still contains everyone's data).
--    Stays a platform/ops-level concern, gated by PERM_BACKUP_MANAGE, not tenant filtering.
--  - laboratory_profile: currently a true singleton (id=1) referenced by fixed ID everywhere.
--    Becoming per-organization is a bigger behavioral change (one row per org, not a filtered
--    view of one shared row) — tracked as a separate follow-up, not bundled into this migration.

-- ----- audit_log --------------------------------------------------------------

ALTER TABLE audit_log ADD COLUMN organization_id BIGINT NULL AFTER id;
UPDATE audit_log SET organization_id = (SELECT id FROM organization WHERE slug = 'primary') WHERE organization_id IS NULL;
ALTER TABLE audit_log MODIFY organization_id BIGINT NOT NULL;
ALTER TABLE audit_log ADD CONSTRAINT fk_audit_log_org FOREIGN KEY (organization_id) REFERENCES organization(id);
CREATE INDEX idx_audit_log_org ON audit_log(organization_id);

-- ----- qc_material --------------------------------------------------------------

ALTER TABLE qc_material ADD COLUMN organization_id BIGINT NULL AFTER id;
UPDATE qc_material SET organization_id = (SELECT id FROM organization WHERE slug = 'primary') WHERE organization_id IS NULL;
ALTER TABLE qc_material MODIFY organization_id BIGINT NOT NULL;
ALTER TABLE qc_material ADD CONSTRAINT fk_qc_material_org FOREIGN KEY (organization_id) REFERENCES organization(id);
CREATE INDEX idx_qc_material_org ON qc_material(organization_id);

-- ----- qc_run --------------------------------------------------------------

ALTER TABLE qc_run ADD COLUMN organization_id BIGINT NULL AFTER id;
UPDATE qc_run SET organization_id = (SELECT id FROM organization WHERE slug = 'primary') WHERE organization_id IS NULL;
ALTER TABLE qc_run MODIFY organization_id BIGINT NOT NULL;
ALTER TABLE qc_run ADD CONSTRAINT fk_qc_run_org FOREIGN KEY (organization_id) REFERENCES organization(id);
CREATE INDEX idx_qc_run_org ON qc_run(organization_id);

-- ----- critical_value_callback ---------------------------------------------------

ALTER TABLE critical_value_callback ADD COLUMN organization_id BIGINT NULL AFTER id;
UPDATE critical_value_callback SET organization_id = (SELECT id FROM organization WHERE slug = 'primary') WHERE organization_id IS NULL;
ALTER TABLE critical_value_callback MODIFY organization_id BIGINT NOT NULL;
ALTER TABLE critical_value_callback ADD CONSTRAINT fk_critical_value_callback_org FOREIGN KEY (organization_id) REFERENCES organization(id);
CREATE INDEX idx_critical_value_callback_org ON critical_value_callback(organization_id);

-- ----- result_comment_template ---------------------------------------------------

ALTER TABLE result_comment_template ADD COLUMN organization_id BIGINT NULL AFTER id;
UPDATE result_comment_template SET organization_id = (SELECT id FROM organization WHERE slug = 'primary') WHERE organization_id IS NULL;
ALTER TABLE result_comment_template MODIFY organization_id BIGINT NOT NULL;
ALTER TABLE result_comment_template ADD CONSTRAINT fk_result_comment_template_org FOREIGN KEY (organization_id) REFERENCES organization(id);
CREATE INDEX idx_result_comment_template_org ON result_comment_template(organization_id);
