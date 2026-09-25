package np.com.lims.payment.dto;

import jakarta.validation.constraints.Size;

public final class PaymentCredentialsDtos {

    private PaymentCredentialsDtos() {
    }

    /**
     * Never exposes a decrypted secret — only whether one is set. A settings screen shows
     * "configured" / "not configured", the same convention as a password field that's never
     * re-displayed after being saved.
     */
    public record Response(
            boolean esewaEnabled, String esewaMerchantCode, boolean esewaSecretConfigured,
            boolean khaltiEnabled, boolean khaltiSecretConfigured,
            boolean fonepayEnabled, String fonepayMerchantCode, boolean fonepaySecretConfigured
    ) {
        public static Response empty() {
            return new Response(false, null, false, false, false, false, null, false);
        }
    }

    /** Leave a secret field blank to keep the existing one — only a non-blank value replaces it. */
    public record UpdateRequest(
            boolean esewaEnabled,
            @Size(max = 120) String esewaMerchantCode,
            @Size(max = 200) String esewaSecretKey,
            boolean khaltiEnabled,
            @Size(max = 200) String khaltiSecretKey,
            boolean fonepayEnabled,
            @Size(max = 120) String fonepayMerchantCode,
            @Size(max = 200) String fonepaySecretKey
    ) {
    }
}
