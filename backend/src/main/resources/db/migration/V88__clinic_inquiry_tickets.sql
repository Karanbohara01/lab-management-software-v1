-- ---------------------------------------------------------------------------
-- V88  Clinic Inquiry & Support Ticket System (Clinics <-> Superadmin)
-- ---------------------------------------------------------------------------

INSERT INTO app_sequence (name, next_value) VALUES ('TICKET_NUMBER', 1);

CREATE TABLE clinic_ticket (
    id                    BIGINT        NOT NULL AUTO_INCREMENT,
    ticket_number         VARCHAR(32)   NOT NULL,
    organization_id       BIGINT        NOT NULL,
    created_by_user_id    BIGINT        NOT NULL,
    assigned_to_user_id   BIGINT        NULL,
    subject               VARCHAR(255)  NOT NULL,
    category              VARCHAR(40)   NOT NULL,
    priority              VARCHAR(20)   NOT NULL DEFAULT 'MEDIUM',
    status                VARCHAR(24)   NOT NULL DEFAULT 'OPEN',
    last_reply_at         DATETIME(6)   NOT NULL,
    resolved_at           DATETIME(6)   NULL,
    closed_at             DATETIME(6)   NULL,

    version               BIGINT        NOT NULL DEFAULT 0,
    created_at            DATETIME(6)   NOT NULL,
    updated_at            DATETIME(6)   NOT NULL,
    created_by            VARCHAR(100)  NULL,
    updated_by            VARCHAR(100)  NULL,

    PRIMARY KEY (id),
    CONSTRAINT uq_clinic_ticket_number UNIQUE (ticket_number),
    CONSTRAINT fk_clinic_ticket_org FOREIGN KEY (organization_id) REFERENCES organization (id),
    CONSTRAINT fk_clinic_ticket_creator FOREIGN KEY (created_by_user_id) REFERENCES app_user (id),
    CONSTRAINT fk_clinic_ticket_assigned FOREIGN KEY (assigned_to_user_id) REFERENCES app_user (id),
    INDEX ix_clinic_ticket_org (organization_id),
    INDEX ix_clinic_ticket_status (status),
    INDEX ix_clinic_ticket_priority (priority),
    INDEX ix_clinic_ticket_last_reply (last_reply_at)
) ENGINE = InnoDB;

CREATE TABLE clinic_ticket_message (
    id                    BIGINT        NOT NULL AUTO_INCREMENT,
    ticket_id             BIGINT        NOT NULL,
    sender_user_id        BIGINT        NOT NULL,
    sender_type           VARCHAR(20)   NOT NULL,
    message               TEXT          NOT NULL,
    is_internal_note      BOOLEAN       NOT NULL DEFAULT FALSE,

    version               BIGINT        NOT NULL DEFAULT 0,
    created_at            DATETIME(6)   NOT NULL,
    updated_at            DATETIME(6)   NOT NULL,
    created_by            VARCHAR(100)  NULL,
    updated_by            VARCHAR(100)  NULL,

    PRIMARY KEY (id),
    CONSTRAINT fk_ticket_message_ticket FOREIGN KEY (ticket_id) REFERENCES clinic_ticket (id) ON DELETE CASCADE,
    CONSTRAINT fk_ticket_message_sender FOREIGN KEY (sender_user_id) REFERENCES app_user (id),
    INDEX ix_ticket_message_ticket (ticket_id),
    INDEX ix_ticket_message_created (created_at)
) ENGINE = InnoDB;
