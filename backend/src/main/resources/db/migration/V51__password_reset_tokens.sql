-- Password reset tokens. Only the SHA-256 hash of the token is stored — the raw token exists only
-- in the emailed link, so a database leak alone can never be used to reset a password. One row per
-- reset request; a token is single-use (used_at) and short-lived (expires_at).

CREATE TABLE password_reset_token (
    id                  BIGINT       NOT NULL AUTO_INCREMENT,
    organization_id     BIGINT       NOT NULL,
    user_id             BIGINT       NOT NULL,
    token_hash          CHAR(64)     NOT NULL,
    expires_at          DATETIME(6)  NOT NULL,
    used_at             DATETIME(6)  NULL,
    version             BIGINT       NOT NULL DEFAULT 0,
    created_at          DATETIME(6)  NOT NULL,
    updated_at          DATETIME(6)  NOT NULL,
    created_by          VARCHAR(100) NULL,
    updated_by          VARCHAR(100) NULL,
    PRIMARY KEY (id),
    CONSTRAINT uq_password_reset_token_hash UNIQUE (token_hash),
    CONSTRAINT fk_password_reset_token_user FOREIGN KEY (user_id) REFERENCES app_user(id),
    INDEX idx_password_reset_token_user (user_id)
) ENGINE = InnoDB;
