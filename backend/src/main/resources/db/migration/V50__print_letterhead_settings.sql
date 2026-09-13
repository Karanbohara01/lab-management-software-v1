-- Some clinics print reports/invoices on pre-printed letterhead stationery (logo, name, address
-- already physically on the paper) and don't want the software repeating that block digitally.
-- Two independent flags, not one — a clinic's report paper and invoice paper stock commonly differ.
ALTER TABLE laboratory_profile
    ADD COLUMN print_report_letterhead TINYINT(1) NOT NULL DEFAULT 1,
    ADD COLUMN print_invoice_letterhead TINYINT(1) NOT NULL DEFAULT 1;
