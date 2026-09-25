package np.com.lims.payment.gateway;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Binds {@code lims.payment.fonepay.*}. Deliberately has no {@code isFullyConfigured()} that would
 * make {@link FonepayGatewayConfig} attempt a live call — see that class's javadoc for why: no
 * verified merchant API spec exists yet for this provider, unlike eSewa/Khalti.
 */
@ConfigurationProperties(prefix = "lims.payment.fonepay")
public record FonepayProperties(
        boolean enabled,
        String merchantCode,
        String secretKey
) {
}
