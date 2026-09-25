-- दफा ६(त) / Anusuchi-8 of the e-invoice procedure: tracks whether the 10%-of-VAT refund report
-- was sent to the payment provider for a verified online payment. See
-- np.com.lims.payment.gateway.PaymentGateway#reportVatRefund and OnlinePaymentService#verify.
-- NOT_APPLICABLE (payment never verified) is the default so existing rows need no backfill.

ALTER TABLE online_payment
    ADD COLUMN vat_refund_report_status VARCHAR(24)  NOT NULL DEFAULT 'NOT_APPLICABLE' AFTER verify_response,
    ADD COLUMN vat_refund_amount        DECIMAL(12,2) NULL AFTER vat_refund_report_status,
    ADD COLUMN vat_refund_reported_at   DATETIME(6)   NULL AFTER vat_refund_amount,
    ADD COLUMN vat_refund_error         VARCHAR(500)  NULL AFTER vat_refund_reported_at;
