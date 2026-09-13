-- Per-organization Sparrow SMS credentials — same pattern as payment_credentials (V42) and
-- ird_credentials (V43). base_url stays global (Sparrow's own API endpoint, not a secret);
-- from/api_key are account-specific and so get their own row. Token stored encrypted
-- (AES-256-GCM, see np.com.lims.common.crypto.CryptoService) — never plaintext.

CREATE TABLE sms_credentials (
    id                BIGINT       NOT NULL AUTO_INCREMENT,
    organization_id   BIGINT       NOT NULL,
    sms_enabled       TINYINT(1)   NOT NULL DEFAULT 0,
    sms_from          VARCHAR(40)  NULL,
    sms_token_enc     VARCHAR(500) NULL,
    version           BIGINT       NOT NULL DEFAULT 0,
    created_at        DATETIME(6)  NOT NULL,
    updated_at        DATETIME(6)  NOT NULL,
    created_by        VARCHAR(100) NULL,
    updated_by        VARCHAR(100) NULL,
    PRIMARY KEY (id),
    CONSTRAINT uq_sms_credentials_org UNIQUE (organization_id),
    CONSTRAINT fk_sms_credentials_org FOREIGN KEY (organization_id) REFERENCES organization(id)
) ENGINE = InnoDB;
