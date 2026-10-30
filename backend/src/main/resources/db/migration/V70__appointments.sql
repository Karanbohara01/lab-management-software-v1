-- ---------------------------------------------------------------------------
-- V70  Appointments (v1): staff-booked future time slots for a patient visit.
--      No capacity/slot limits and no test selection at booking time yet —
--      an appointment just reserves a time; converting it into a priced
--      LabOrder happens later, through the existing order-creation flow, and
--      is recorded here only as a link (converted_order_id), never the other
--      way around, so this table never needs to know anything about pricing.
-- ---------------------------------------------------------------------------

INSERT INTO app_sequence (name, next_value) VALUES ('APPOINTMENT_NUMBER', 1);

CREATE TABLE appointment (
    id                   BIGINT        NOT NULL AUTO_INCREMENT,
    organization_id      BIGINT        NOT NULL,
    appointment_number   VARCHAR(24)   NOT NULL,
    patient_id           BIGINT        NOT NULL,
    referring_doctor_id  BIGINT        NULL,
    branch_id            BIGINT        NULL,
    scheduled_at         DATETIME(6)   NOT NULL,
    reason               VARCHAR(500)  NULL,
    status               VARCHAR(24)   NOT NULL,
    checked_in_at        DATETIME(6)   NULL,
    cancelled_at         DATETIME(6)   NULL,
    cancel_reason        VARCHAR(500)  NULL,
    converted_at         DATETIME(6)   NULL,
    converted_order_id   BIGINT        NULL,

    version              BIGINT        NOT NULL DEFAULT 0,
    created_at           DATETIME(6)   NOT NULL,
    updated_at           DATETIME(6)   NOT NULL,
    created_by           VARCHAR(100)  NULL,
    updated_by           VARCHAR(100)  NULL,
    PRIMARY KEY (id),
    CONSTRAINT uq_appointment_number UNIQUE (organization_id, appointment_number),
    CONSTRAINT fk_appointment_org FOREIGN KEY (organization_id) REFERENCES organization (id),
    CONSTRAINT fk_appointment_patient FOREIGN KEY (patient_id) REFERENCES patient (id),
    CONSTRAINT fk_appointment_doctor FOREIGN KEY (referring_doctor_id) REFERENCES doctor (id),
    CONSTRAINT fk_appointment_branch FOREIGN KEY (branch_id) REFERENCES branch (id),
    CONSTRAINT fk_appointment_order FOREIGN KEY (converted_order_id) REFERENCES lab_order (id),
    INDEX ix_appointment_org (organization_id),
    INDEX ix_appointment_patient (patient_id),
    INDEX ix_appointment_status (status),
    INDEX ix_appointment_scheduled_at (scheduled_at)
) ENGINE = InnoDB;

INSERT INTO permission (name, description, created_at, updated_at, created_by, updated_by) VALUES
 ('APPOINTMENT_READ','View appointments',NOW(6),NOW(6),'system','system'),
 ('APPOINTMENT_WRITE','Book / reschedule / cancel appointments',NOW(6),NOW(6),'system','system');

-- role_permission grants made by earlier migrations (including V2's blanket grant of "every
-- permission that existed at the time" to SUPER_ADMIN / LAB_ADMINISTRATOR) are NOT retroactive —
-- see V25__multi_branch.sql's identical note. Every role that should see appointments, SUPER_ADMIN
-- and LAB_ADMINISTRATOR included, needs an explicit grant here.

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM role r JOIN permission p
WHERE p.name IN ('APPOINTMENT_READ', 'APPOINTMENT_WRITE')
  AND r.name IN ('SUPER_ADMIN', 'LAB_ADMINISTRATOR', 'RECEPTIONIST');

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM role r JOIN permission p
WHERE p.name = 'APPOINTMENT_READ' AND r.name = 'DOCTOR';
