-- Third payment-gateway slot (see np.com.lims.payment.gateway.PaymentGateway/PaymentGatewayRegistry
-- for the plugin architecture) alongside eSewa/Khalti. Credentials can be entered and stored now;
-- FonepayGatewayConfig's initiate()/verify() honestly refuse every call until Fonepay's real
-- merchant API spec is obtained and live-verified, the same way eSewa/Khalti/CBMS were — never
-- fabricated from unverified secondary sources.

ALTER TABLE payment_credentials
    ADD COLUMN fonepay_enabled        TINYINT(1)   NOT NULL DEFAULT 0 AFTER khalti_secret_key_enc,
    ADD COLUMN fonepay_merchant_code  VARCHAR(120) NULL AFTER fonepay_enabled,
    ADD COLUMN fonepay_secret_key_enc VARCHAR(500) NULL AFTER fonepay_merchant_code;
