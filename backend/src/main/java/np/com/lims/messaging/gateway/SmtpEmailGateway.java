package np.com.lims.messaging.gateway;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.util.StringUtils;

import java.io.UnsupportedEncodingException;

/**
 * Real gateway using plain SMTP via Spring's {@link JavaMailSender} (auto-configured by
 * {@code spring-boot-starter-mail} only when {@code spring.mail.host} is set — that's what
 * {@link #isConfigured()} keys off, alongside {@code lims.mail.enabled}). Deliberately plain SMTP
 * rather than a provider-specific HTTP API (SendGrid/SES/etc.) — works with any mailbox a
 * deployment already has (Gmail app password, a hosting provider's SMTP, a corporate relay),
 * needing no separate account/signup, unlike every other gateway in this codebase.
 */
@Configuration
@EnableConfigurationProperties(EmailProperties.class)
public class SmtpEmailGateway {

    private static final Logger log = LoggerFactory.getLogger(SmtpEmailGateway.class);

    @Bean
    public EmailGateway emailGateway(EmailProperties properties, ObjectProvider<JavaMailSender> mailSenderProvider) {
        return new Impl(properties, mailSenderProvider);
    }

    private record Impl(EmailProperties properties, ObjectProvider<JavaMailSender> mailSenderProvider)
            implements EmailGateway {

        @Override
        public String provider() {
            return "SMTP";
        }

        @Override
        public boolean isConfigured() {
            return properties.enabled()
                    && StringUtils.hasText(properties.fromAddress())
                    && mailSenderProvider.getIfAvailable() != null;
        }

        @Override
        public Result send(String toEmail, String subject, String textBody) {
            JavaMailSender sender = mailSenderProvider.getIfAvailable();
            if (!isConfigured() || sender == null) {
                return Result.transportError("EMAIL_NOT_CONFIGURED",
                        "Email delivery is not configured for this deployment "
                                + "(lims.mail.enabled and spring.mail.host must both be set). No message was sent.");
            }

            try {
                MimeMessage message = sender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
                helper.setFrom(properties.fromAddress(), properties.fromName());
                helper.setTo(toEmail);
                helper.setSubject(subject);
                helper.setText(textBody, false);
                sender.send(message);
                return Result.sent();
            } catch (MessagingException | UnsupportedEncodingException | MailException ex) {
                log.warn("SMTP send failed for {}: {}", toEmail, ex.toString());
                return Result.transportError("EMAIL_UNREACHABLE", "SMTP send failed: " + ex.getMessage());
            }
        }
    }
}
