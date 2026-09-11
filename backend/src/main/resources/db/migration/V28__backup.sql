-- ---------------------------------------------------------------------------
-- V28  Database/log backup tracking, per the e-invoice procedure's mandatory
--      backup requirement (दफा ६(ढ) / ८(घ)): "विद्युतीय माध्यमबाट विजक जारी गर्न
--      अनुमति प्राप्त ब्यक्तिले अनिवार्य रुपमा हरेक आर्थिक वर्षको डाटाबेस र लग को व्याकअप
--      राख्नुपर्नेछ" — every fiscal year's database and log must be backed up.
--      This tracks each backup run (scheduled or manually triggered); the
--      actual backup file is written to disk by DatabaseBackupService.
-- ---------------------------------------------------------------------------

CREATE TABLE backup_run (
    id                BIGINT       NOT NULL AUTO_INCREMENT,
    status            VARCHAR(24)  NOT NULL,
    started_at        DATETIME(6)  NOT NULL,
    completed_at      DATETIME(6)  NULL,
    file_path         VARCHAR(500) NULL,
    file_size_bytes   BIGINT       NULL,
    table_count       INT          NULL,
    row_count         BIGINT       NULL,
    error_message     VARCHAR(1000) NULL,
    triggered_by      VARCHAR(100) NULL,
    PRIMARY KEY (id),
    INDEX ix_backup_run_started_at (started_at)
) ENGINE = InnoDB;

INSERT INTO permission (name, description, created_at, updated_at, created_by, updated_by) VALUES
 ('BACKUP_READ','View database backup history',NOW(6),NOW(6),'system','system'),
 ('BACKUP_MANAGE','Trigger and download database backups',NOW(6),NOW(6),'system','system');

-- Earlier migrations' "blanket grant everything to SUPER_ADMIN" is a one-time snapshot, not a
-- standing rule (see the rbac-new-permission-grants lesson) — every new permission must be
-- explicitly granted here too, or even superadmin ends up locked out of it.
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM role r JOIN permission p
WHERE p.name IN ('BACKUP_READ', 'BACKUP_MANAGE')
  AND r.name IN ('SUPER_ADMIN', 'LAB_ADMINISTRATOR');
