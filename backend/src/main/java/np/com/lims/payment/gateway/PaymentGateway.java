package np.com.lims.payment.gateway;

import np.com.lims.payment.entity.PaymentProvider;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Port for a Nepali online payment gateway (eSewa, Khalti). Two steps, mirroring how every real
 * hosted-checkout gateway actually works:
 * <ol>
 *   <li>{@link #initiate} — start a checkout, get back either a redirect URL (Khalti) or an
 *       auto-submitting form's action URL + signed fields (eSewa) to send the browser to.</li>
 *   <li>{@link #verify} — after the gateway redirects the browser back, ALWAYS make our own
 *       server-to-server call to confirm the transaction actually succeeded before recording any
 *       money. The client-side redirect (and any query params on it) must never be trusted on
 *       its own — a forged or replayed redirect must never itself count as payment.</li>
 * </ol>
 *
 * <p>Until a real provider's credentials are configured, {@code UnconfiguredPaymentGateway}
 * (one per provider) is active and transmits nothing.
 */
public interface PaymentGateway {

    PaymentProvider provider();

    boolean isConfigured();

    InitiateResult initiate(InitiatePayload payload);

    VerifyResult verify(String transactionUuid, BigDecimal expectedAmount);

    /**
     * दफा ६(त) / Anusuchi-8 of the e-invoice procedure: when a customer pays via an electronic
     * payment instrument, the software must automatically send the bill/payment/VAT details to
     * "the payment system operator or payment service provider" so THEY can credit the customer
     * 10% of the VAT amount, per Nepal Rastra Bank's national/international standard. Called once,
     * right after a payment is verified (see {@code OnlinePaymentService.verify}) — never blocks
     * or reverses the payment itself if this fails, since the money already genuinely changed
     * hands by this point.
     *
     * <p>The regulation names a standard to follow but not a concrete endpoint/schema per
     * provider — none of eSewa/Khalti/Fonepay's real wire format for this specific call was
     * available from an authoritative source when this was written (this is a different call than
     * their ordinary checkout/verify APIs). Every implementation of this method must be honest
     * about that: return {@link VatRefundResult#notSupported} rather than guessing at a payload
     * shape or endpoint, until verified real documentation exists for that provider.
     */
    VatRefundResult reportVatRefund(VatRefundPayload payload);

    record InitiatePayload(
            String transactionUuid, BigDecimal amount, String purchaseOrderName,
            String successUrl, String failureUrl, String customerName, String customerPhone
    ) {
    }

    /**
     * Either {@code redirectUrl} is set (Khalti: send the browser straight there) or
     * {@code formAction} + {@code formFields} are set (eSewa: the frontend must auto-submit a
     * hidden POST form with these exact fields to this URL — eSewa does not accept a plain
     * GET redirect).
     */
    record InitiateResult(
            boolean success, String redirectUrl, String formAction, Map<String, String> formFields,
            String errorMessage, String rawResponse
    ) {
        public static InitiateResult redirect(String url, String raw) {
            return new InitiateResult(true, url, null, null, null, raw);
        }

        public static InitiateResult form(String action, Map<String, String> fields, String raw) {
            return new InitiateResult(true, null, action, fields, null, raw);
        }

        public static InitiateResult failed(String errorMessage) {
            return new InitiateResult(false, null, null, null, errorMessage, null);
        }
    }

    record VerifyResult(boolean verified, String providerReference, String errorMessage, String rawResponse) {
        public static VerifyResult verified(String providerReference, String raw) {
            return new VerifyResult(true, providerReference, null, raw);
        }

        public static VerifyResult notVerified(String errorMessage, String raw) {
            return new VerifyResult(false, null, errorMessage, raw);
        }
    }

    /** Exactly Anusuchi-8's field list, in order: Seller PAN, Bill Number, Payment Date, Total Amount, VAT, 10%-of-VAT, Customer Id, Transaction Id. */
    record VatRefundPayload(
            String sellerPan, String invoiceNumber, java.time.Instant paymentDate,
            BigDecimal totalAmount, BigDecimal vatAmount, BigDecimal refundAmount,
            String customerId, String transactionId
    ) {
    }

    record VatRefundResult(boolean sent, boolean supported, String errorMessage, String rawResponse) {
        public static VatRefundResult sent(String raw) {
            return new VatRefundResult(true, true, null, raw);
        }

        public static VatRefundResult failed(String errorMessage, String raw) {
            return new VatRefundResult(false, true, errorMessage, raw);
        }

        /** Honest default until a provider's real Anusuchi-8 wire format is verified — see {@link #reportVatRefund}. */
        public static VatRefundResult notSupported(String provider) {
            return new VatRefundResult(false, false,
                    provider + " does not yet implement Anusuchi-8 VAT-refund reporting "
                            + "(no verified API spec for this call was available).", null);
        }
    }
}
