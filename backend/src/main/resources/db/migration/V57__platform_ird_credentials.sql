-- This deployment's own shared CBMS taxpayer login, editable from the platform admin dashboard
-- instead of only via application.yml/env vars — same shape as ird_credentials (per-clinic
-- override, V19-ish) but a single row with no organization_id, since this is the platform
-- operator's own registration, not any one clinic's. See CbmsIrdGateway.resolve(): precedence is
-- now a clinic's own credentials (if set) -> this platform-wide row (if set) -> static
-- application.yml lims.ird.* (lowest-precedence fallback, e.g. for a pure env-var deployment).

CREATE TABLE platform_ird_credentials (
    id                  BIGINT       NOT NULL AUTO_INCREMENT,
    ird_enabled         TINYINT(1)   NOT NULL DEFAULT 0,
    ird_username        VARCHAR(120) NULL,
    ird_password_enc    VARCHAR(500) NULL,
    ird_seller_pan      VARCHAR(40)  NULL,
    ird_seller_name     VARCHAR(160) NULL,
    version             BIGINT       NOT NULL DEFAULT 0,
    created_at          DATETIME(6)  NOT NULL,
    updated_at          DATETIME(6)  NOT NULL,
    created_by          VARCHAR(100) NULL,
    updated_by          VARCHAR(100) NULL,
    PRIMARY KEY (id)
) ENGINE = InnoDB;
