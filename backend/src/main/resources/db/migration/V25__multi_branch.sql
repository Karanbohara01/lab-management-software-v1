-- ---------------------------------------------------------------------------
-- V25  Multi-branch: real branch master data, replacing the free-text
--      patient.registration_branch field for operational scoping. Orders
--      (and everything reached through them - samples, invoices) belong to
--      a branch; a staff member's home_branch_id restricts what they can
--      see (null = access to every branch, for HQ / roaming roles).
-- ---------------------------------------------------------------------------

CREATE TABLE branch (
    id           BIGINT       NOT NULL AUTO_INCREMENT,
    code         VARCHAR(24)  NOT NULL,
    name         VARCHAR(160) NOT NULL,
    address_line VARCHAR(300) NULL,
    city         VARCHAR(120) NULL,
    phone        VARCHAR(64)  NULL,
    email        VARCHAR(160) NULL,
    active       TINYINT(1)   NOT NULL DEFAULT 1,
    version      BIGINT       NOT NULL DEFAULT 0,
    created_at   DATETIME(6)  NOT NULL,
    updated_at   DATETIME(6)  NOT NULL,
    created_by   VARCHAR(100) NULL,
    updated_by   VARCHAR(100) NULL,
    PRIMARY KEY (id),
    CONSTRAINT uq_branch_code UNIQUE (code)
) ENGINE = InnoDB;

-- Seed a single default branch (id=1) so every existing order backfills cleanly.
INSERT INTO branch (id, code, name, active, created_at, updated_at, created_by, updated_by)
VALUES (1, 'MAIN', 'Main Branch', 1, NOW(6), NOW(6), 'system', 'system');

ALTER TABLE lab_order
    ADD COLUMN branch_id BIGINT NOT NULL DEFAULT 1 AFTER patient_id;
ALTER TABLE lab_order
    ADD CONSTRAINT fk_lab_order_branch FOREIGN KEY (branch_id) REFERENCES branch (id);
CREATE INDEX ix_lab_order_branch ON lab_order (branch_id);

ALTER TABLE app_user
    ADD COLUMN home_branch_id BIGINT NULL AFTER phone;
ALTER TABLE app_user
    ADD CONSTRAINT fk_app_user_home_branch FOREIGN KEY (home_branch_id) REFERENCES branch (id);

INSERT INTO permission (name, description, created_at, updated_at, created_by, updated_by) VALUES
 ('BRANCH_READ','View branches',NOW(6),NOW(6),'system','system'),
 ('BRANCH_WRITE','Manage branches',NOW(6),NOW(6),'system','system');

-- Front-desk / floor / accounts roles need to read the branch list for the filters and pickers.
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM role r JOIN permission p
WHERE p.name = 'BRANCH_READ'
  AND r.name IN ('RECEPTIONIST', 'LAB_TECHNICIAN', 'PATHOLOGIST', 'ACCOUNTANT', 'SAMPLE_COLLECTION_STAFF', 'DOCTOR');

-- NOTE: role_permission grants made by earlier migrations (e.g. V2's blanket grant of "every
-- permission that existed at the time" to SUPER_ADMIN / LAB_ADMINISTRATOR) are NOT retroactive.
-- Any permission introduced by a later migration must be explicitly granted here too.
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM role r JOIN permission p
WHERE p.name IN ('BRANCH_READ', 'BRANCH_WRITE')
  AND r.name IN ('SUPER_ADMIN', 'LAB_ADMINISTRATOR');
