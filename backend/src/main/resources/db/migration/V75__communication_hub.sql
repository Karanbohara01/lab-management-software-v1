-- ---------------------------------------------------------------------------
-- V75  Communication Hub: SMS templates, campaigns, automation rules, and a
--      single message log every attempt (individual or bulk) writes to.
--
--      Samaya SMS becomes a second SMS provider alongside the existing
--      Sparrow SMS integration (sms_credentials, V44) — this migration adds
--      samaya_* columns to that same table rather than replacing it, exactly
--      the way payment_credentials holds esewa_*/khalti_*/fonepay_* columns
--      side by side. SparrowSmsGateway and its existing callers are untouched.
--
--      sms_message is the one table every SMS attempt — automated, manual, or
--      part of a campaign — writes a row to, so "every SMS attempt has a
--      corresponding database record" (the feature's own requirement) holds
--      structurally, not by convention.
--
--      sms_campaign + sms_campaign_recipient follow the patient_import_job /
--      patient_import_row lease-and-stage pattern from V73 exactly: a
--      campaign is staged (its recipients computed and written as rows) before
--      a background worker claims it and sends in batches, so a restarted
--      server resumes an in-flight campaign instead of re-sending it or losing
--      it, and the same claim/heartbeat columns guard against two workers
--      racing the same campaign.
-- ---------------------------------------------------------------------------

ALTER TABLE sms_credentials
    ADD COLUMN samaya_enabled      TINYINT(1)   NOT NULL DEFAULT 0 AFTER sms_token_enc,
    ADD COLUMN samaya_base_url     VARCHAR(255) NULL     AFTER samaya_enabled,
    ADD COLUMN samaya_api_key_enc  VARCHAR(500) NULL     AFTER samaya_base_url,
    ADD COLUMN samaya_sender_id    VARCHAR(40)  NULL     AFTER samaya_api_key_enc;

INSERT INTO app_sequence (name, next_value) VALUES ('SMS_CAMPAIGN_NUMBER', 1);

-- Idempotency for the appointment-reminder sweep: a reminder is sent at most
-- once per appointment, regardless of how many times the sweep runs.
ALTER TABLE appointment
    ADD COLUMN reminder_sent_at DATETIME(6) NULL AFTER reason;


CREATE TABLE sms_template (
    id                BIGINT        NOT NULL AUTO_INCREMENT,
    organization_id   BIGINT        NOT NULL,
    name              VARCHAR(160)  NOT NULL,
    category          VARCHAR(32)   NOT NULL,
    body              VARCHAR(1000) NOT NULL,
    active            TINYINT(1)    NOT NULL DEFAULT 1,
    version           BIGINT        NOT NULL DEFAULT 0,
    created_at        DATETIME(6)   NOT NULL,
    updated_at        DATETIME(6)   NOT NULL,
    created_by        VARCHAR(100)  NULL,
    updated_by        VARCHAR(100)  NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_sms_template_org FOREIGN KEY (organization_id) REFERENCES organization(id),
    CONSTRAINT uq_sms_template_org_name UNIQUE (organization_id, name),
    INDEX ix_sms_template_org_category (organization_id, category)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;


CREATE TABLE sms_automation_rule (
    id                     BIGINT        NOT NULL AUTO_INCREMENT,
    organization_id        BIGINT        NOT NULL,
    event_type             VARCHAR(40)   NOT NULL,
    enabled                TINYINT(1)    NOT NULL DEFAULT 0,
    template_id            BIGINT        NULL,
    -- Only meaningful for APPOINTMENT_REMINDER: how many hours before the
    -- scheduled time the reminder sweep should fire. NULL for every other
    -- event type, which fires synchronously from the triggering action instead.
    reminder_offset_hours  INT           NULL,
    version                BIGINT        NOT NULL DEFAULT 0,
    created_at             DATETIME(6)   NOT NULL,
    updated_at             DATETIME(6)   NOT NULL,
    created_by             VARCHAR(100)  NULL,
    updated_by             VARCHAR(100)  NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_sms_automation_rule_org FOREIGN KEY (organization_id) REFERENCES organization(id),
    CONSTRAINT fk_sms_automation_rule_template FOREIGN KEY (template_id) REFERENCES sms_template(id),
    -- One rule per event type per organization — "enable/disable" toggles this
    -- one row rather than creating duplicates.
    CONSTRAINT uq_sms_automation_rule_org_event UNIQUE (organization_id, event_type)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;


CREATE TABLE sms_campaign (
    id                  BIGINT        NOT NULL AUTO_INCREMENT,
    organization_id     BIGINT        NOT NULL,
    campaign_number     VARCHAR(24)   NOT NULL,
    name                VARCHAR(200)  NOT NULL,
    template_id         BIGINT        NULL,
    -- The message text as it will be sent, placeholders and all — snapshotted
    -- at creation so editing a template later never changes an already-queued
    -- or already-sent campaign's wording.
    message_body        VARCHAR(1000) NOT NULL,
    category            VARCHAR(32)   NOT NULL,
    -- The recipient-selection criteria the administrator chose (filter type,
    -- date range, department, etc.), kept for the campaign report and so a
    -- scheduled campaign's recipients can be (re)computed at send time rather
    -- than going stale between creation and a future scheduled date.
    recipient_filter    JSON          NULL,

    status              VARCHAR(24)   NOT NULL,
    total_recipients    INT           NOT NULL DEFAULT 0,
    sent_count          INT           NOT NULL DEFAULT 0,
    failed_count        INT           NOT NULL DEFAULT 0,
    estimated_segments  INT           NOT NULL DEFAULT 0,

    scheduled_at        DATETIME(6)   NULL,
    time_zone           VARCHAR(40)   NOT NULL DEFAULT 'Asia/Kathmandu',

    -- Lease: which worker holds this campaign and when it last said so — same
    -- reclaim-on-stale-heartbeat mechanism as patient_import_job (V73).
    claimed_by          VARCHAR(100)  NULL,
    claimed_at          DATETIME(6)   NULL,
    heartbeat_at        DATETIME(6)   NULL,

    started_at          DATETIME(6)   NULL,
    completed_at        DATETIME(6)   NULL,
    cancelled_at        DATETIME(6)   NULL,
    cancel_requested    TINYINT(1)    NOT NULL DEFAULT 0,
    failure_message     VARCHAR(1000) NULL,

    version             BIGINT        NOT NULL DEFAULT 0,
    created_at          DATETIME(6)   NOT NULL,
    updated_at          DATETIME(6)   NOT NULL,
    created_by          VARCHAR(100)  NULL,
    updated_by          VARCHAR(100)  NULL,

    PRIMARY KEY (id),
    CONSTRAINT fk_sms_campaign_org FOREIGN KEY (organization_id) REFERENCES organization(id),
    CONSTRAINT fk_sms_campaign_template FOREIGN KEY (template_id) REFERENCES sms_template(id),
    CONSTRAINT uq_sms_campaign_org_number UNIQUE (organization_id, campaign_number),
    INDEX ix_sms_campaign_org_status (organization_id, status),
    -- The scheduler's claim query: due-to-run scheduled campaigns, and
    -- in-flight campaigns whose worker lease has gone stale.
    INDEX ix_sms_campaign_status_scheduled (status, scheduled_at),
    INDEX ix_sms_campaign_status_heartbeat (status, heartbeat_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;


CREATE TABLE sms_campaign_recipient (
    id              BIGINT        NOT NULL AUTO_INCREMENT,
    organization_id BIGINT        NOT NULL,
    campaign_id     BIGINT        NOT NULL,
    patient_id      BIGINT        NULL,
    phone           VARCHAR(20)   NOT NULL,
    name            VARCHAR(160)  NULL,
    sequence_no     INT           NOT NULL,

    status          VARCHAR(24)   NOT NULL,
    message_id      BIGINT        NULL,
    error_message   VARCHAR(500)  NULL,

    created_at      DATETIME(6)   NOT NULL,
    processed_at    DATETIME(6)   NULL,

    PRIMARY KEY (id),
    CONSTRAINT fk_sms_campaign_recipient_campaign FOREIGN KEY (campaign_id) REFERENCES sms_campaign(id) ON DELETE CASCADE,
    CONSTRAINT fk_sms_campaign_recipient_patient FOREIGN KEY (patient_id) REFERENCES patient(id),
    -- Duplicate phone numbers within one campaign are rejected at the database
    -- level, not just by application-side pre-filtering.
    CONSTRAINT uq_sms_campaign_recipient_phone UNIQUE (campaign_id, phone),
    -- The batch worker's claim query: this campaign's still-pending rows, in order.
    INDEX ix_sms_campaign_recipient_campaign_status (campaign_id, status, sequence_no)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;


CREATE TABLE sms_message (
    id                  BIGINT        NOT NULL AUTO_INCREMENT,
    organization_id     BIGINT        NOT NULL,
    campaign_id         BIGINT        NULL,
    automation_rule_id  BIGINT        NULL,
    patient_id          BIGINT        NULL,

    recipient_phone     VARCHAR(20)   NOT NULL,
    recipient_name      VARCHAR(160)  NULL,
    category            VARCHAR(32)   NOT NULL,
    message_body        VARCHAR(1000) NOT NULL,
    segment_count        INT          NOT NULL DEFAULT 1,
    -- GSM7 (plain text, 160/153 chars per segment) or UCS2 (any Unicode
    -- character incl. Devanagari, 70/67 chars per segment) — whichever the
    -- message actually needed, so segment_count is explainable later.
    encoding            VARCHAR(8)    NOT NULL,

    provider             VARCHAR(16)  NOT NULL,
    -- ACCEPTED: the gateway's HTTP call returned success for this request.
    -- FAILED: the gateway rejected it or the request errored before/without a
    --         provider response.
    -- DELIVERED: a real delivery-confirmation signal from the provider — never
    --         set just because the gateway accepted the request (see
    --         PatientMessagingService / SamayaSmsGateway javadoc: Samaya's
    --         publicly available documentation describes no delivery-report
    --         mechanism, so this status is reachable in code but, honestly,
    --         not reachable in practice until/unless Samaya confirms one).
    -- UNKNOWN: accepted by the gateway, but with no way to confirm delivery —
    --         the honest resting state for every successfully sent message
    --         today.
    status              VARCHAR(16)   NOT NULL,
    provider_reference  VARCHAR(120)  NULL,
    error_code          VARCHAR(40)   NULL,
    error_message       VARCHAR(500)  NULL,

    -- Null for an automation-triggered or campaign-sent message; the acting
    -- user's username for a manually-sent individual SMS.
    sent_by             VARCHAR(100)  NULL,
    sent_at             DATETIME(6)   NULL,
    created_at          DATETIME(6)   NOT NULL,

    PRIMARY KEY (id),
    CONSTRAINT fk_sms_message_org FOREIGN KEY (organization_id) REFERENCES organization(id),
    CONSTRAINT fk_sms_message_campaign FOREIGN KEY (campaign_id) REFERENCES sms_campaign(id),
    CONSTRAINT fk_sms_message_automation_rule FOREIGN KEY (automation_rule_id) REFERENCES sms_automation_rule(id),
    CONSTRAINT fk_sms_message_patient FOREIGN KEY (patient_id) REFERENCES patient(id),
    INDEX ix_sms_message_org_created (organization_id, created_at),
    INDEX ix_sms_message_org_patient (organization_id, patient_id),
    INDEX ix_sms_message_org_campaign (organization_id, campaign_id),
    INDEX ix_sms_message_org_status (organization_id, status),
    INDEX ix_sms_message_org_category (organization_id, category)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;


-- sms_campaign_recipient.message_id can't reference sms_message until that
-- table exists, so the FK is added after both tables are created.
ALTER TABLE sms_campaign_recipient
    ADD CONSTRAINT fk_sms_campaign_recipient_message FOREIGN KEY (message_id) REFERENCES sms_message(id);


-- Minimal "patient needs a follow-up" tracker — nothing like it exists
-- anywhere in the schema today. Deliberately its own small table (not a
-- column bolted onto patient/report) since a patient can have more than one
-- outstanding follow-up and it has its own lifecycle (PENDING/DONE/CANCELLED)
-- independent of any single visit.
CREATE TABLE patient_follow_up (
    id                BIGINT        NOT NULL AUTO_INCREMENT,
    organization_id   BIGINT        NOT NULL,
    patient_id        BIGINT        NOT NULL,
    due_date          DATE          NOT NULL,
    reason            VARCHAR(255)  NULL,
    status            VARCHAR(16)   NOT NULL DEFAULT 'PENDING',
    -- Idempotency for the follow-up-due sweep, same shape as
    -- appointment.reminder_sent_at above.
    reminder_sent_at  DATETIME(6)   NULL,
    version           BIGINT        NOT NULL DEFAULT 0,
    created_at        DATETIME(6)   NOT NULL,
    updated_at        DATETIME(6)   NOT NULL,
    created_by        VARCHAR(100)  NULL,
    updated_by        VARCHAR(100)  NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_patient_follow_up_org FOREIGN KEY (organization_id) REFERENCES organization(id),
    CONSTRAINT fk_patient_follow_up_patient FOREIGN KEY (patient_id) REFERENCES patient(id),
    -- The sweep's claim query: due, still-pending, not-yet-reminded follow-ups.
    INDEX ix_patient_follow_up_org_status_due (organization_id, status, due_date)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;


-- Permissions. Six, matching the distinct actions the feature spec calls out
-- (view / send individual / manage campaigns / manage templates / manage
-- automation / configure the gateway) rather than one blanket COMMUNICATION_*
-- permission, so a receptionist can be given "send" without "configure the
-- API credentials" the way the rest of this system's RBAC is already grained.
INSERT INTO permission (name, description, created_at, updated_at, created_by, updated_by) VALUES
 ('COMMUNICATION_READ','View the communication dashboard, SMS history and delivery reports',NOW(6),NOW(6),'system','system'),
 ('COMMUNICATION_SEND','Send an individual SMS to a patient',NOW(6),NOW(6),'system','system'),
 ('COMMUNICATION_CAMPAIGN_MANAGE','Create, send, schedule and cancel bulk SMS campaigns',NOW(6),NOW(6),'system','system'),
 ('COMMUNICATION_TEMPLATE_MANAGE','Create, edit and delete SMS templates',NOW(6),NOW(6),'system','system'),
 ('COMMUNICATION_AUTOMATION_MANAGE','Enable, disable and configure automated SMS notification rules',NOW(6),NOW(6),'system','system'),
 ('COMMUNICATION_CONFIG_MANAGE','Configure the SMS gateway (provider credentials, sender ID)',NOW(6),NOW(6),'system','system');

-- Grants are not retroactive (see V70/V73's note): spelled out explicitly per
-- role rather than assumed from "super admin has everything".
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM role r JOIN permission p
WHERE p.name IN ('COMMUNICATION_READ','COMMUNICATION_SEND','COMMUNICATION_CAMPAIGN_MANAGE',
                  'COMMUNICATION_TEMPLATE_MANAGE','COMMUNICATION_AUTOMATION_MANAGE','COMMUNICATION_CONFIG_MANAGE')
  AND r.name IN ('SUPER_ADMIN', 'LAB_ADMINISTRATOR');

-- Front desk and accounts can send messages and see history, but not touch
-- campaigns/templates/automation rules/gateway credentials.
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM role r JOIN permission p
WHERE p.name IN ('COMMUNICATION_READ','COMMUNICATION_SEND')
  AND r.name IN ('RECEPTIONIST', 'ACCOUNTANT');
