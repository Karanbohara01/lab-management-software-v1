package np.com.lims.messaging.gateway;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * The active SMS gateway until a real, credentialed provider is wired in. It sends nothing and
 * every attempt fails with a clear, honest error rather than pretending to succeed.
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
