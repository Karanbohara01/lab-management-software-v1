-- Doctor (referring doctors) was missed in the earlier tenant-isolation slices — it has its own
-- repository with a direct search query, so it needs the same organization_id + @Filter pattern
-- as everything else. Also converts nmc_number's uniqueness from global to per-organization
-- (two different clinics' own referring-doctor records can legitimately reference the same real
-- doctor by NMC number without conflicting with each other).

ALTER TABLE doctor ADD COLUMN organization_id BIGINT NULL AFTER id;
UPDATE doctor SET organization_id = (SELECT id FROM organization WHERE slug = 'primary') WHERE organization_id IS NULL;
ALTER TABLE doctor MODIFY organization_id BIGINT NOT NULL;
ALTER TABLE doctor ADD CONSTRAINT fk_doctor_org FOREIGN KEY (organization_id) REFERENCES organization(id);
ALTER TABLE doctor DROP INDEX uq_doctor_nmc;
ALTER TABLE doctor ADD CONSTRAINT uq_doctor_nmc UNIQUE (organization_id, nmc_number);
CREATE INDEX idx_doctor_org ON doctor(organization_id);
