-- Per-organization eSewa/Khalti credentials — the first integration moved off this deployment's
-- one shared application.yml config onto a real per-clinic setting. A clinic with no row here (or
-- with its own gateway left disabled) transparently falls back to the deployment-wide
-- application.yml credentials (see np.com.lims.payment.gateway.EsewaGatewayConfig/
-- KhaltiGatewayConfig) — existing behavior for the 'primary' organization is unchanged unless it
-- explicitly configures its own. Secret fields are stored encrypted (AES-256-GCM, see
-- np.com.lims.common.crypto.CryptoService) — never plaintext at rest.

CREATE TABLE payment_credentials (
    id                   BIGINT       NOT NULL AUTO_INCREMENT,
    organization_id      BIGINT       NOT NULL,
    esewa_enabled        TINYINT(1)   NOT NULL DEFAULT 0,
    esewa_merchant_code  VARCHAR(120) NULL,
    esewa_secret_key_enc VARCHAR(500) NULL,
    khalti_enabled       TINYINT(1)   NOT NULL DEFAULT 0,
    khalti_secret_key_enc VARCHAR(500) NULL,
    version              BIGINT       NOT NULL DEFAULT 0,
    created_at           DATETIME(6)  NOT NULL,
    updated_at           DATETIME(6)  NOT NULL,
    created_by           VARCHAR(100) NULL,
    updated_by           VARCHAR(100) NULL,
    PRIMARY KEY (id),
    CONSTRAINT uq_payment_credentials_org UNIQUE (organization_id),
    CONSTRAINT fk_payment_credentials_org FOREIGN KEY (organization_id) REFERENCES organization(id)
) ENGINE = InnoDB;
