-- laboratory_profile stops being a true singleton (fixed id=1, one row for the whole
-- installation) and becomes one row per organization — every clinic needs its own letterhead,
-- fiscal year, tax rate and operational settings, not a shared view of one row. The existing row
-- (id=1) becomes the 'primary' organization's profile; its id column switches from a manually
-- fixed PK to a normal AUTO_INCREMENT one so future organizations can get their own row.

ALTER TABLE laboratory_profile MODIFY id BIGINT NOT NULL AUTO_INCREMENT;

ALTER TABLE laboratory_profile ADD COLUMN organization_id BIGINT NULL AFTER id;
UPDATE laboratory_profile SET organization_id = (SELECT id FROM organization WHERE slug = 'primary') WHERE organization_id IS NULL;
ALTER TABLE laboratory_profile MODIFY organization_id BIGINT NOT NULL;
ALTER TABLE laboratory_profile ADD CONSTRAINT fk_laboratory_profile_org FOREIGN KEY (organization_id) REFERENCES organization(id);
ALTER TABLE laboratory_profile ADD CONSTRAINT uq_laboratory_profile_org UNIQUE (organization_id);
