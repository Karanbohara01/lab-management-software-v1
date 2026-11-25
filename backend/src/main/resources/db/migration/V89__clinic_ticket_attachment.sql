-- ---------------------------------------------------------------------------
-- V89  Ticket Message Attachments (Screenshots/Logs) and Unread Tracking
-- ---------------------------------------------------------------------------

ALTER TABLE clinic_ticket
    ADD COLUMN clinic_has_unread BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX ix_clinic_ticket_unread ON clinic_ticket (organization_id, clinic_has_unread);

ALTER TABLE clinic_ticket_message
    ADD COLUMN file_name VARCHAR(255) NULL,
    ADD COLUMN file_type VARCHAR(100) NULL,
    ADD COLUMN file_size_bytes BIGINT NULL,
    ADD COLUMN file_data LONGBLOB NULL;
