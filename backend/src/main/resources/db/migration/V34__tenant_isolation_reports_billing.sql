-- Phase 1 of tenant isolation, slice 3: report, invoice, refund, ird_submission, online_payment —
-- the clinical-output and financial tables. Same pattern as V32/V33. `payment` is NOT given its
-- own column: it has no standalone repository (no cross-invoice query exists for it), it's only
-- ever accessed via its parent invoice's own (now-filtered) collection. `refund`/`ird_submission`/
-- `online_payment` DO get their own column because each has a repository with direct
-- cross-parent queries (refund approval queue, IRD submissions list/status-count, online-payment
-- transaction lookup).

-- ----- report ------------------------------------------------------------

ALTER TABLE report ADD COLUMN organization_id BIGINT NULL AFTER id;
UPDATE report SET organization_id = (SELECT id FROM organization WHERE slug = 'primary') WHERE organization_id IS NULL;
ALTER TABLE report MODIFY organization_id BIGINT NOT NULL;
ALTER TABLE report ADD CONSTRAINT fk_report_org FOREIGN KEY (organization_id) REFERENCES organization(id);
ALTER TABLE report DROP INDEX uq_report_number;
ALTER TABLE report ADD CONSTRAINT uq_report_number UNIQUE (organization_id, report_number);
CREATE INDEX idx_report_org ON report(organization_id);

-- ----- invoice ------------------------------------------------------------

ALTER TABLE invoice ADD COLUMN organization_id BIGINT NULL AFTER id;
UPDATE invoice SET organization_id = (SELECT id FROM organization WHERE slug = 'primary') WHERE organization_id IS NULL;
ALTER TABLE invoice MODIFY organization_id BIGINT NOT NULL;
ALTER TABLE invoice ADD CONSTRAINT fk_invoice_org FOREIGN KEY (organization_id) REFERENCES organization(id);
ALTER TABLE invoice DROP INDEX uq_invoice_number;
ALTER TABLE invoice ADD CONSTRAINT uq_invoice_number UNIQUE (organization_id, invoice_number);
CREATE INDEX idx_invoice_org ON invoice(organization_id);

-- ----- refund ---------------------------------------------------------------

ALTER TABLE refund ADD COLUMN organization_id BIGINT NULL AFTER id;
UPDATE refund SET organization_id = (SELECT id FROM organization WHERE slug = 'primary') WHERE organization_id IS NULL;
ALTER TABLE refund MODIFY organization_id BIGINT NOT NULL;
ALTER TABLE refund ADD CONSTRAINT fk_refund_org FOREIGN KEY (organization_id) REFERENCES organization(id);
CREATE INDEX idx_refund_org ON refund(organization_id);

-- ----- ird_submission ---------------------------------------------------------

ALTER TABLE ird_submission ADD COLUMN organization_id BIGINT NULL AFTER id;
UPDATE ird_submission SET organization_id = (SELECT id FROM organization WHERE slug = 'primary') WHERE organization_id IS NULL;
ALTER TABLE ird_submission MODIFY organization_id BIGINT NOT NULL;
ALTER TABLE ird_submission ADD CONSTRAINT fk_ird_submission_org FOREIGN KEY (organization_id) REFERENCES organization(id);
CREATE INDEX idx_ird_submission_org ON ird_submission(organization_id);

-- ----- online_payment ----------------------------------------------------------

ALTER TABLE online_payment ADD COLUMN organization_id BIGINT NULL AFTER id;
UPDATE online_payment SET organization_id = (SELECT id FROM organization WHERE slug = 'primary') WHERE organization_id IS NULL;
ALTER TABLE online_payment MODIFY organization_id BIGINT NOT NULL;
ALTER TABLE online_payment ADD CONSTRAINT fk_online_payment_org FOREIGN KEY (organization_id) REFERENCES organization(id);
CREATE INDEX idx_online_payment_org ON online_payment(organization_id);
