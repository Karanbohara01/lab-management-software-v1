-- ---------------------------------------------------------------------------
-- V87  Link patient medical documents (e.g. prescriptions) to lab orders
-- ---------------------------------------------------------------------------

ALTER TABLE lab_order
    ADD COLUMN prescription_document_id BIGINT NULL,
    ADD CONSTRAINT fk_lab_order_prescription_doc
        FOREIGN KEY (prescription_document_id) REFERENCES patient_document (id)
        ON DELETE SET NULL;

CREATE INDEX ix_lab_order_prescription_doc ON lab_order (prescription_document_id);
