-- Closes the remaining gaps from the enterprise-report review: a printed report only showed a
-- single "Report date" with no Collected/Received timestamps (needed for real TAT auditing), and
-- the lab header had no accreditation number field (NABL/ISO 15189 etc.) alongside the PAN.

ALTER TABLE report_test
    ADD COLUMN collected_at DATETIME(6) NULL AFTER accession_number,
    ADD COLUMN received_at  DATETIME(6) NULL AFTER collected_at;

ALTER TABLE laboratory_profile
    ADD COLUMN accreditation_number VARCHAR(60) NULL AFTER pan_number;
