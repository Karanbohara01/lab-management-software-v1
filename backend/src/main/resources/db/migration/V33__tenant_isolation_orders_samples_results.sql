-- Phase 1 of tenant isolation, slice 2: lab_order, sample, test_result — the next biggest
-- PHI-bearing chunk after app_user/branch/department/patient (V32). Same pattern: own
-- organization_id, backfilled into the existing 'primary' organization, enforced via each
-- entity's own Hibernate tenantFilter. Child tables (lab_order_item, sample_item, result_value,
-- culture_*) are NOT given their own column — they have no standalone repository with direct
-- cross-parent queries, so isolation via their parent's filter is sufficient.

-- ----- lab_order -----------------------------------------------------------

ALTER TABLE lab_order ADD COLUMN organization_id BIGINT NULL AFTER id;
UPDATE lab_order SET organization_id = (SELECT id FROM organization WHERE slug = 'primary') WHERE organization_id IS NULL;
ALTER TABLE lab_order MODIFY organization_id BIGINT NOT NULL;
ALTER TABLE lab_order ADD CONSTRAINT fk_lab_order_org FOREIGN KEY (organization_id) REFERENCES organization(id);
ALTER TABLE lab_order DROP INDEX uq_lab_order_number;
ALTER TABLE lab_order ADD CONSTRAINT uq_lab_order_number UNIQUE (organization_id, order_number);
CREATE INDEX idx_lab_order_org ON lab_order(organization_id);

-- ----- sample ----------------------------------------------------------------

ALTER TABLE sample ADD COLUMN organization_id BIGINT NULL AFTER id;
UPDATE sample SET organization_id = (SELECT id FROM organization WHERE slug = 'primary') WHERE organization_id IS NULL;
ALTER TABLE sample MODIFY organization_id BIGINT NOT NULL;
ALTER TABLE sample ADD CONSTRAINT fk_sample_org FOREIGN KEY (organization_id) REFERENCES organization(id);
ALTER TABLE sample DROP INDEX uq_sample_accession;
ALTER TABLE sample DROP INDEX uq_sample_barcode;
ALTER TABLE sample ADD CONSTRAINT uq_sample_accession UNIQUE (organization_id, accession_number);
ALTER TABLE sample ADD CONSTRAINT uq_sample_barcode UNIQUE (organization_id, barcode_value);
CREATE INDEX idx_sample_org ON sample(organization_id);

-- ----- test_result -----------------------------------------------------------

ALTER TABLE test_result ADD COLUMN organization_id BIGINT NULL AFTER id;
UPDATE test_result SET organization_id = (SELECT id FROM organization WHERE slug = 'primary') WHERE organization_id IS NULL;
ALTER TABLE test_result MODIFY organization_id BIGINT NOT NULL;
ALTER TABLE test_result ADD CONSTRAINT fk_test_result_org FOREIGN KEY (organization_id) REFERENCES organization(id);
CREATE INDEX idx_test_result_org ON test_result(organization_id);
