-- One organization's own WhatsApp Business Cloud API credentials, overriding this deployment's
-- shared application.yml config for that org only — same pattern as payment/ird/sms_credentials.
CREATE TABLE whatsapp_credentials (
    id                     BIGINT       NOT NULL AUTO_INCREMENT,
    organization_id        BIGINT       NOT NULL,
    whatsapp_enabled       TINYINT(1)   NOT NULL DEFAULT 0,
    phone_number_id        VARCHAR(60)  NULL,
    access_token_enc       VARCHAR(1000) NULL,
    version                BIGINT       NOT NULL DEFAULT 0,
    created_at             DATETIME(6)  NOT NULL,
    updated_at             DATETIME(6)  NOT NULL,
    created_by             VARCHAR(100) NULL,
    updated_by             VARCHAR(100) NULL,
    PRIMARY KEY (id),
    CONSTRAINT uq_whatsapp_credentials_org UNIQUE (organization_id),
    CONSTRAINT fk_whatsapp_credentials_org FOREIGN KEY (organization_id) REFERENCES organization(id)
) ENGINE = InnoDB;
