-- ---------------------------------------------------------------------------
-- V17  Enterprise test catalog: profiles/panels, calculated parameters,
--      plausibility limits, categorical value lists, method/LOINC metadata,
--      reference-range effective dates and age units, specimen requirements.
-- ---------------------------------------------------------------------------

ALTER TABLE lab_test
    ADD COLUMN test_type        VARCHAR(16)  NOT NULL DEFAULT 'ANALYTE',
    ADD COLUMN fasting_required TINYINT(1)   NOT NULL DEFAULT 0,
    ADD COLUMN fasting_hours    INT          NULL,
    ADD COLUMN container_type   VARCHAR(60)  NULL,
    ADD COLUMN min_volume_ml    DECIMAL(6,2) NULL,
    ADD COLUMN stability_note   VARCHAR(300) NULL,
    ADD COLUMN is_referral      TINYINT(1)   NOT NULL DEFAULT 0,
    ADD COLUMN referral_lab     VARCHAR(160) NULL,
    ADD COLUMN loinc_code       VARCHAR(20)  NULL;

CREATE TABLE test_profile_member (
    id              BIGINT NOT NULL AUTO_INCREMENT,
    profile_test_id BIGINT NOT NULL,
    member_test_id  BIGINT NOT NULL,
    display_order   INT    NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    CONSTRAINT fk_tpm_profile FOREIGN KEY (profile_test_id) REFERENCES lab_test (id),
    CONSTRAINT fk_tpm_member  FOREIGN KEY (member_test_id)  REFERENCES lab_test (id),
    CONSTRAINT uq_tpm UNIQUE (profile_test_id, member_test_id),
    INDEX ix_tpm_profile (profile_test_id)
) ENGINE = InnoDB;

ALTER TABLE test_parameter
    ADD COLUMN decimal_places      INT           NULL,
    ADD COLUMN calculation_formula VARCHAR(500)  NULL,
    ADD COLUMN allowed_values      VARCHAR(500)  NULL,
    ADD COLUMN absurd_low          DECIMAL(16,4) NULL,
    ADD COLUMN absurd_high         DECIMAL(16,4) NULL,
    ADD COLUMN method              VARCHAR(120)  NULL,
    ADD COLUMN loinc_code          VARCHAR(20)   NULL,
    ADD COLUMN group_heading       VARCHAR(120)  NULL;

ALTER TABLE reference_range
    ADD COLUMN effective_from      DATE         NULL,
    ADD COLUMN source              VARCHAR(200) NULL,
    ADD COLUMN applies_to_pregnant TINYINT(1)   NOT NULL DEFAULT 0,
    ADD COLUMN age_unit            VARCHAR(8)   NOT NULL DEFAULT 'YEARS';
