package np.com.lims.payment.gateway;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Binds {@code lims.payment.esewa.*} — see application.yml for the full explanation of each property. */
@ConfigurationProperties(prefix = "lims.payment.esewa")
public record EsewaProperties(
        boolean enabled,
        String environment,
        String formAction,
        String verifyBaseUrl,
        String merchantCode,
        String secretKey
) {
    public boolean isFullyConfigured() {
        return enabled && hasText(formAction) && hasText(verifyBaseUrl) && hasText(merchantCode) && hasText(secretKey);
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
