package np.com.lims.ird.gateway;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Binds {@code lims.ird.*} — see application.yml for the full explanation of each property.
 * {@code enabled=false} (the default) keeps {@link UnconfiguredIrdGateway} active regardless
 * of whatever else is set here.
 */
@ConfigurationProperties(prefix = "lims.ird")
public record IrdProperties(
        boolean enabled,
        String environment,
        String baseUrl,
        String username,
        String password,
        String sellerPan
) {
    public boolean isFullyConfigured() {
        return enabled
                && hasText(baseUrl)
                && hasText(username)
                && hasText(password)
                && hasText(sellerPan);
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
