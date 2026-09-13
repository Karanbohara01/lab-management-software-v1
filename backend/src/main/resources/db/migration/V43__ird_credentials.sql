-- Per-organization IRD/CBMS credentials — same pattern as V42's payment_credentials. base_url/
-- environment stay global (an infrastructure choice, not a secret, same CBMS endpoint for every
-- clinic in this deployment); username/password/seller_pan are the taxpayer-specific fields a
-- clinic must supply for its own IRD registration and so get their own row. Password stored
-- encrypted (AES-256-GCM, see np.com.lims.common.crypto.CryptoService) — never plaintext.

CREATE TABLE ird_credentials (
    id                  BIGINT       NOT NULL AUTO_INCREMENT,
    organization_id     BIGINT       NOT NULL,
    ird_enabled         TINYINT(1)   NOT NULL DEFAULT 0,
    ird_username        VARCHAR(120) NULL,
    ird_password_enc    VARCHAR(500) NULL,
    ird_seller_pan      VARCHAR(40)  NULL,
    version             BIGINT       NOT NULL DEFAULT 0,
    created_at          DATETIME(6)  NOT NULL,
    updated_at          DATETIME(6)  NOT NULL,
    created_by          VARCHAR(100) NULL,
    updated_by          VARCHAR(100) NULL,
    PRIMARY KEY (id),
    CONSTRAINT uq_ird_credentials_org UNIQUE (organization_id),
    CONSTRAINT fk_ird_credentials_org FOREIGN KEY (organization_id) REFERENCES organization(id)
) ENGINE = InnoDB;
