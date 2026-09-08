-- ---------------------------------------------------------------------------
-- V14  Enterprise patient registration: richer demographics, structured
--      Nepal address (permanent + current), emergency contact / guardian,
--      patient classification, safety flags, consent capture, and a
--      normalised phone column to support duplicate detection.
-- ---------------------------------------------------------------------------

ALTER TABLE patient
    ADD COLUMN salutation            VARCHAR(16)   NULL AFTER mrn,
    ADD COLUMN name_local            VARCHAR(160)  NULL AFTER full_name,
    ADD COLUMN blood_group           VARCHAR(16)   NULL,
    ADD COLUMN marital_status        VARCHAR(16)   NULL,
    ADD COLUMN occupation            VARCHAR(120)  NULL,
    ADD COLUMN nationality           VARCHAR(60)   NULL,
    ADD COLUMN preferred_language    VARCHAR(40)   NULL,
    ADD COLUMN alternate_phone       VARCHAR(32)   NULL,
    ADD COLUMN phone_digits          VARCHAR(16)   NULL,
    ADD COLUMN external_mrn          VARCHAR(40)   NULL,
    ADD COLUMN patient_category      VARCHAR(24)   NOT NULL DEFAULT 'WALK_IN',
    ADD COLUMN registration_channel  VARCHAR(20)   NOT NULL DEFAULT 'WALK_IN',
    ADD COLUMN registration_branch   VARCHAR(80)   NULL,
    ADD COLUMN referral_source_type  VARCHAR(24)   NOT NULL DEFAULT 'SELF',
    ADD COLUMN referral_source_name  VARCHAR(200)  NULL,
    -- permanent address (address_line / city / district / province already exist)
    ADD COLUMN municipality          VARCHAR(120)  NULL,
    ADD COLUMN ward_no               VARCHAR(8)    NULL,
    ADD COLUMN tole                  VARCHAR(120)  NULL,
    ADD COLUMN country               VARCHAR(60)   NULL,
    -- current / mailing address (nullable: null means "same as permanent")
    ADD COLUMN current_address_line  VARCHAR(200)  NULL,
    ADD COLUMN current_city          VARCHAR(100)  NULL,
    ADD COLUMN current_district      VARCHAR(100)  NULL,
    ADD COLUMN current_province      VARCHAR(100)  NULL,
    ADD COLUMN current_municipality  VARCHAR(120)  NULL,
    ADD COLUMN current_ward_no       VARCHAR(8)    NULL,
    ADD COLUMN current_tole          VARCHAR(120)  NULL,
    ADD COLUMN current_country       VARCHAR(60)   NULL,
    -- emergency contact / guardian
    ADD COLUMN emergency_name          VARCHAR(120) NULL,
    ADD COLUMN emergency_relationship  VARCHAR(40)  NULL,
    ADD COLUMN emergency_phone         VARCHAR(32)  NULL,
    ADD COLUMN emergency_is_guardian   TINYINT(1)   NOT NULL DEFAULT 0,
    -- safety flags
    ADD COLUMN vip            TINYINT(1) NOT NULL DEFAULT 0,
    ADD COLUMN confidential   TINYINT(1) NOT NULL DEFAULT 0,
    ADD COLUMN deceased       TINYINT(1) NOT NULL DEFAULT 0,
    ADD COLUMN deceased_date  DATE       NULL,
    ADD COLUMN test_record    TINYINT(1) NOT NULL DEFAULT 0,
    -- consent (NP Privacy Act 2075)
    ADD COLUMN consent_store         TINYINT(1)   NOT NULL DEFAULT 0,
    ADD COLUMN consent_share_reports TINYINT(1)   NOT NULL DEFAULT 0,
    ADD COLUMN consent_research      TINYINT(1)   NOT NULL DEFAULT 0,
    ADD COLUMN consent_captured_at   DATETIME(6)  NULL,
    ADD COLUMN consent_captured_by   VARCHAR(100) NULL;

CREATE INDEX ix_patient_phone_digits ON patient (phone_digits);
CREATE INDEX ix_patient_external_mrn ON patient (external_mrn);
CREATE INDEX ix_patient_category     ON patient (patient_category);
CREATE INDEX ix_patient_dob          ON patient (date_of_birth);

-- Backfill the normalised phone column for existing rows (digits only, last 10).
UPDATE patient
SET phone_digits = RIGHT(REGEXP_REPLACE(COALESCE(phone, ''), '[^0-9]', ''), 10)
WHERE phone IS NOT NULL AND phone <> '';
