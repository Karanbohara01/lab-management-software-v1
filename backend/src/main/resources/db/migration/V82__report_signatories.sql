-- Replaces the laboratory_profile's single fixed signature with an ordered list of named
-- signature lines ("Lab Technician", "Consultant Pathologist", or whatever roles a lab's own
-- report layout actually needs) — each with its own optional pre-uploaded signature image.
CREATE TABLE report_signatory (
    id                  BIGINT        NOT NULL AUTO_INCREMENT,
    organization_id     BIGINT        NOT NULL,
    title               VARCHAR(80)   NOT NULL,
    signature_data_uri  MEDIUMTEXT    NULL,
    display_order       INT           NOT NULL DEFAULT 0,
    version             BIGINT        NOT NULL DEFAULT 0,
    created_at          DATETIME(6)   NOT NULL,
    updated_at          DATETIME(6)   NOT NULL,
    created_by          VARCHAR(100)  NULL,
    updated_by          VARCHAR(100)  NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_report_signatory_org FOREIGN KEY (organization_id) REFERENCES organization(id),
    INDEX ix_report_signatory_org_order (organization_id, display_order)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Preserve every organization's existing two-line report footer by default. Seeded off
-- laboratory_profile (one row per organization, always present — see its own class doc) rather
-- than the organization table directly, so both lines stay in lockstep for every org that has one.
INSERT INTO report_signatory (organization_id, title, signature_data_uri, display_order, version, created_at, updated_at)
SELECT lp.organization_id, 'Lab Technician', NULL, 0, 0, NOW(6), NOW(6) FROM laboratory_profile lp;

INSERT INTO report_signatory (organization_id, title, signature_data_uri, display_order, version, created_at, updated_at)
SELECT lp.organization_id, 'Consultant Pathologist', lp.signature_data_uri, 1, 0, NOW(6), NOW(6)
FROM laboratory_profile lp;

ALTER TABLE laboratory_profile DROP COLUMN signature_data_uri;
