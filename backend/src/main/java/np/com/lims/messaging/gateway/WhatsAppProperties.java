package np.com.lims.messaging.gateway;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Binds {@code lims.whatsapp.*} — see application.yml for the full explanation of each property. */
@ConfigurationProperties(prefix = "lims.whatsapp")
public record WhatsAppProperties(
        boolean enabled,
        String phoneNumberId,
        String accessToken,
        String apiVersion
) {
    public boolean isFullyConfigured() {
        return enabled && hasText(phoneNumberId) && hasText(accessToken);
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
