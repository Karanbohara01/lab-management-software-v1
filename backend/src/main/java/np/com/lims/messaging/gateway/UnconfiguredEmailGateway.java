package np.com.lims.messaging.gateway;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * A safety-net default: if {@code SmtpEmailGateway} were ever conditionally disabled, this bean
 * would take over and transmit nothing, every send recorded as a transport error with a clear,
 * honest message. Currently dormant in practice (its {@code @ConditionalOnMissingBean} never
 * triggers), kept as the fallback of last resort — same pattern as {@code UnconfiguredSmsGateway}.
 */
@Configuration
public class UnconfiguredEmailGateway {

    @Bean
    @ConditionalOnMissingBean(EmailGateway.class)
    public EmailGateway emailGateway() {
        return new EmailGateway() {
            @Override
            public String provider() {
                return "DISABLED";
            }

            @Override
            public boolean isConfigured() {
                return false;
            }

            @Override
            public Result send(String toEmail, String subject, String textBody) {
                return Result.transportError("EMAIL_NOT_CONFIGURED",
                        "Email delivery is not configured. No message was sent.");
            }
        };
    }
}
