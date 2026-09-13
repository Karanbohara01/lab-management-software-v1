package np.com.lims.messaging.gateway;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Binds {@code lims.sms.*} — see application.yml for the full explanation of each property. */
@ConfigurationProperties(prefix = "lims.sms")
public record SmsProperties(
        boolean enabled,
        String provider,
        String baseUrl,
        String apiKey,
        String from
) {
    public boolean isFullyConfigured() {
        return enabled && hasText(baseUrl) && hasText(apiKey) && hasText(from);
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
