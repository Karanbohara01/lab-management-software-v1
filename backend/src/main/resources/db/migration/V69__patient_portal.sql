-- Patient self-service portal: a durable, unguessable token per patient (128-bit, generated
-- lazily on first request — see PatientPortalService.ensureToken) that lets that patient view
-- their own RELEASED reports and non-draft invoices without a LabOS login, the same trust model
-- the existing report verification link already uses (the token IS the credential).

ALTER TABLE patient
    ADD COLUMN portal_token VARCHAR(64) NULL,
    ADD CONSTRAINT uq_patient_portal_token UNIQUE (portal_token);
