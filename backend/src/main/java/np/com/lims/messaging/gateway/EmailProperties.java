package np.com.lims.messaging.gateway;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Binds {@code lims.mail.*} — see application.yml for the full explanation of each property. */
@ConfigurationProperties(prefix = "lims.mail")
public record EmailProperties(boolean enabled, String fromAddress, String fromName) {
}
