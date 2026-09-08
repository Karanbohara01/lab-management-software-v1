-- ---------------------------------------------------------------------------
-- V1  Core identity, RBAC and audit log
-- ---------------------------------------------------------------------------

CREATE TABLE permission (
    id           BIGINT       NOT NULL AUTO_INCREMENT,
    name         VARCHAR(64)  NOT NULL,
    description  VARCHAR(255) NULL,
    version      BIGINT       NOT NULL DEFAULT 0,
    created_at   DATETIME(6)  NOT NULL,
    updated_at   DATETIME(6)  NOT NULL,
    created_by   VARCHAR(100) NULL,
    updated_by   VARCHAR(100) NULL,
    PRIMARY KEY (id),
    CONSTRAINT uq_permission_name UNIQUE (name)
) ENGINE = InnoDB;

CREATE TABLE role (
    id           BIGINT       NOT NULL AUTO_INCREMENT,
    name         VARCHAR(48)  NOT NULL,
    description  VARCHAR(255) NULL,
    version      BIGINT       NOT NULL DEFAULT 0,
    created_at   DATETIME(6)  NOT NULL,
    updated_at   DATETIME(6)  NOT NULL,
    created_by   VARCHAR(100) NULL,
    updated_by   VARCHAR(100) NULL,
    PRIMARY KEY (id),
    CONSTRAINT uq_role_name UNIQUE (name)
) ENGINE = InnoDB;

CREATE TABLE role_permission (
    role_id       BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_rp_role       FOREIGN KEY (role_id)       REFERENCES role (id)       ON DELETE CASCADE,
    CONSTRAINT fk_rp_permission FOREIGN KEY (permission_id) REFERENCES permission (id) ON DELETE CASCADE
) ENGINE = InnoDB;

CREATE TABLE app_user (
    id            BIGINT        NOT NULL AUTO_INCREMENT,
    username      VARCHAR(64)   NOT NULL,
    email         VARCHAR(160)  NOT NULL,
    password_hash VARCHAR(100)  NOT NULL,
    full_name     VARCHAR(160)  NOT NULL,
    phone         VARCHAR(32)   NULL,
    enabled       TINYINT(1)    NOT NULL DEFAULT 1,
    last_login_at DATETIME(6)   NULL,
    version       BIGINT        NOT NULL DEFAULT 0,
    created_at    DATETIME(6)   NOT NULL,
    updated_at    DATETIME(6)   NOT NULL,
    created_by    VARCHAR(100)  NULL,
    updated_by    VARCHAR(100)  NULL,
    PRIMARY KEY (id),
    CONSTRAINT uq_user_username UNIQUE (username),
    CONSTRAINT uq_user_email    UNIQUE (email)
) ENGINE = InnoDB;

CREATE TABLE user_role (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_ur_user FOREIGN KEY (user_id) REFERENCES app_user (id) ON DELETE CASCADE,
    CONSTRAINT fk_ur_role FOREIGN KEY (role_id) REFERENCES role (id)     ON DELETE CASCADE
) ENGINE = InnoDB;

CREATE TABLE audit_log (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    actor         VARCHAR(100) NOT NULL,
    action        VARCHAR(64)  NOT NULL,
    module        VARCHAR(64)  NOT NULL,
    entity_type   VARCHAR(96)  NULL,
    entity_id     VARCHAR(64)  NULL,
    summary       VARCHAR(500) NULL,
    before_state  JSON         NULL,
    after_state   JSON         NULL,
    ip_address    VARCHAR(64)  NULL,
    user_agent    VARCHAR(255) NULL,
    created_at    DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    INDEX ix_audit_actor (actor),
    INDEX ix_audit_module (module),
    INDEX ix_audit_entity (entity_type, entity_id),
    INDEX ix_audit_created_at (created_at)
) ENGINE = InnoDB;
