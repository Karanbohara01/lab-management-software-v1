package np.com.lims.payment.gateway;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Binds {@code lims.payment.khalti.*} — see application.yml for the full explanation of each property. */
@ConfigurationProperties(prefix = "lims.payment.khalti")
public record KhaltiProperties(
        boolean enabled,
        String environment,
        String baseUrl,
        String secretKey,
        String websiteUrl
) {
    public boolean isFullyConfigured() {
        return enabled && hasText(baseUrl) && hasText(secretKey) && hasText(websiteUrl);
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
