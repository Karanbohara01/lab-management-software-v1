-- Tenant isolation, catalog slice: lab_test — each clinic defines its own test menu, codes,
-- prices and reference ranges, not a shared catalog. Same pattern as every prior slice: own
-- organization_id, backfilled into 'primary', @Filter, per-org code uniqueness (two clinics can
-- both have a test coded "CBC" without conflict). Child tables (test_parameter,
-- reference_range, test_profile_member) are NOT given their own column — no standalone
-- repository/cross-parent query exists for them, they're only ever reached via their parent
-- LabTest's own (now-filtered) graph.
--
-- Deliberately NOT touched: `antibiotic` (microbiology susceptibility drug reference list) stays
-- global — it's standard medical reference data (drug names/classes), not clinic-configurable
-- content, the same category as `role`/`permission`/`subscription_plan`.

ALTER TABLE lab_test ADD COLUMN organization_id BIGINT NULL AFTER id;
UPDATE lab_test SET organization_id = (SELECT id FROM organization WHERE slug = 'primary') WHERE organization_id IS NULL;
ALTER TABLE lab_test MODIFY organization_id BIGINT NOT NULL;
ALTER TABLE lab_test ADD CONSTRAINT fk_lab_test_org FOREIGN KEY (organization_id) REFERENCES organization(id);
ALTER TABLE lab_test DROP INDEX uq_lab_test_code;
ALTER TABLE lab_test ADD CONSTRAINT uq_lab_test_code UNIQUE (organization_id, code);
CREATE INDEX idx_lab_test_org ON lab_test(organization_id);
