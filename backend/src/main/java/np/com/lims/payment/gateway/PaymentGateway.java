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
}
