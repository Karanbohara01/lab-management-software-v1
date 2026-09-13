package np.com.lims.messaging.gateway;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * A safety-net default: if {@code SparrowSmsGateway} were ever conditionally disabled again (it
 * currently always registers — see that class, which resolves "configured or not" dynamically per
 * organization/request), this bean would take over and send nothing, every attempt failing with a
 * clear, honest error rather than pretending to succeed. Currently dormant in practice (its
 * {@code @ConditionalOnMissingBean} never triggers), kept as the fallback of last resort.
 */
@Configuration
public class UnconfiguredSmsGateway {

    @Bean
    @ConditionalOnMissingBean(SmsGateway.class)
    public SmsGateway smsGateway() {
        return new SmsGateway() {
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
                return Result.transportError("SMS_NOT_CONFIGURED",
                        "SMS delivery is not configured. No message was sent. An SMS aggregator "
                                + "(e.g. Sparrow SMS) and credentials are required before automatic SMS delivery "
                                + "can be used — record this delivery manually (Print / Hand) in the meantime.");
            }
        };
    }
}
