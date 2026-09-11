package np.com.lims.messaging.gateway;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * The active WhatsApp gateway until a real, credentialed provider is wired in. It sends nothing
 * and every attempt fails with a clear, honest error rather than pretending to succeed.
 */
@Configuration
public class UnconfiguredWhatsAppGateway {

    @Bean
    @ConditionalOnMissingBean(WhatsAppGateway.class)
    public WhatsAppGateway whatsAppGateway() {
        return new WhatsAppGateway() {
            @Override
            public String provider() {
                return "DISABLED";
            }

            @Override
            public boolean isConfigured() {
                return false;
            }

            @Override
            public Result send(String toPhone, String message) {
                return Result.transportError("WHATSAPP_NOT_CONFIGURED",
                        "WhatsApp delivery is not configured. No message was sent. A verified WhatsApp "
                                + "Business Account and API credentials are required before automatic WhatsApp "
                                + "delivery can be used — record this delivery manually (Print / Hand) in the meantime.");
            }
        };
    }
}
