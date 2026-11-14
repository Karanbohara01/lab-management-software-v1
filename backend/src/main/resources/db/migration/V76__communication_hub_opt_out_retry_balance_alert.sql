-- ---------------------------------------------------------------------------
-- V76  Communication Hub enhancements: a do-not-contact list and a low-balance
--      alert threshold. Retry/resend (the third enhancement shipped alongside
--      this migration) reuses sms_message / sms_campaign_recipient as they
--      already are — no schema change needed for that part.
--
--      sms_opt_out is keyed by phone number, not patient: a campaign's
--      recipient list can include raw phone numbers with no patient_id at all
--      (CSV import, a custom phone list), and the same phone can legitimately
--      belong to more than one patient record (a shared family phone) — so
--      "this number asked to stop" has to be a fact about the number itself,
--      not a flag on one particular patient row. patient_id is kept only as
--      an optional, non-authoritative cross-reference for display. Enforced
--      at SmsMessageService#send — the single choke point every SMS attempt
--      already goes through — so manual, automated and campaign sends are
--      all covered by one check with no path that can bypass it.
-- ---------------------------------------------------------------------------

CREATE TABLE sms_opt_out (
    id                BIGINT        NOT NULL AUTO_INCREMENT,
    organization_id   BIGINT        NOT NULL,
    phone             VARCHAR(20)   NOT NULL,
    patient_id        BIGINT        NULL,
    reason            VARCHAR(255)  NULL,
    note              VARCHAR(500)  NULL,
    version           BIGINT        NOT NULL DEFAULT 0,
    created_at        DATETIME(6)   NOT NULL,
    updated_at        DATETIME(6)   NOT NULL,
    created_by        VARCHAR(100)  NULL,
    updated_by        VARCHAR(100)  NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_sms_opt_out_org FOREIGN KEY (organization_id) REFERENCES organization(id),
    CONSTRAINT fk_sms_opt_out_patient FOREIGN KEY (patient_id) REFERENCES patient(id),
    CONSTRAINT uq_sms_opt_out_org_phone UNIQUE (organization_id, phone)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;


-- A per-organization low-balance alert threshold (credits). NULL = alerts
-- disabled — matching this feature's existing "every automated notification
-- defaults OFF" convention (see sms_automation_rule, V75): nobody gets paged
-- over SMS credits until they opt in. Lives on sms_credentials rather than a
-- Samaya-specific table since it applies to whichever gateway is effective
-- for the organization, even though only Samaya implements a balance check
-- today.
ALTER TABLE sms_credentials
    ADD COLUMN low_balance_threshold INT NULL AFTER samaya_sender_id;
