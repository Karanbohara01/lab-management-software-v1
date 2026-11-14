package np.com.lims.communication.gateway;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Binds {@code lims.sms.samaya.*} — this deployment's shared Samaya SMS account, used when an
 * organization hasn't set its own (see {@code SmsCredentials.samaya*} / {@code SamayaSmsGateway}).
 * {@code baseUrl} is per-customer rather than a fixed shared domain — see {@code SamayaSmsGateway}'s
 * javadoc for why.
 */
@ConfigurationProperties(prefix = "lims.sms.samaya")
public record SamayaSmsProperties(
        boolean enabled,
        String baseUrl,
        String apiKey,
        String senderId
) {
    public boolean isFullyConfigured() {
        return enabled && hasText(baseUrl) && hasText(apiKey) && hasText(senderId);
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
