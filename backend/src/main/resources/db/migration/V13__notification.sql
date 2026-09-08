-- ---------------------------------------------------------------------------
-- V13  Operational notifications and per-user read markers.
-- ---------------------------------------------------------------------------

CREATE TABLE notification (
    id                 BIGINT       NOT NULL AUTO_INCREMENT,
    type               VARCHAR(48)  NOT NULL,
    severity           VARCHAR(16)  NOT NULL,
    title              VARCHAR(200) NOT NULL,
    message            VARCHAR(1000) NULL,
    link_path          VARCHAR(200) NULL,
    target_permission  VARCHAR(64)  NULL,
    reference          VARCHAR(160) NULL,
    created_at         DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    INDEX ix_notification_created_at (created_at),
    INDEX ix_notification_ref (type, reference)
) ENGINE = InnoDB;

CREATE TABLE notification_read_by (
    notification_id BIGINT       NOT NULL,
    username        VARCHAR(100) NOT NULL,
    PRIMARY KEY (notification_id, username),
    CONSTRAINT fk_notification_read FOREIGN KEY (notification_id) REFERENCES notification (id) ON DELETE CASCADE
) ENGINE = InnoDB;
