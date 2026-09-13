package np.com.lims.messaging;

import np.com.lims.messaging.gateway.SmsGateway;
import np.com.lims.messaging.gateway.WhatsAppGateway;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.Set;

/**
 * Sends a patient a short "your report is ready" message with a link to the signed, verifiable
 * report, over SMS or WhatsApp. A thin orchestrator over {@link SmsGateway} / {@link WhatsAppGateway} —
 * it never guesses at delivery; if the underlying gateway isn't configured the caller gets an
 * honest failure, never a silent no-op reported as success.
 */
@Service
public class PatientMessagingService {

    private static final Set<String> CHANNELS = Set.of("SMS", "WHATSAPP");

    private final SmsGateway smsGateway;
    private final WhatsAppGateway whatsAppGateway;
    private final String publicUrl;

    public PatientMessagingService(SmsGateway smsGateway, WhatsAppGateway whatsAppGateway,
                                   @Value("${lims.app.public-url}") String publicUrl) {
        this.smsGateway = smsGateway;
        this.whatsAppGateway = whatsAppGateway;
        this.publicUrl = publicUrl;
    }

    public record SendResult(boolean sent, String providerReference, String errorMessage) {
    }

    /** True when {@code method} names a channel this service can actually transmit over. */
    public static boolean isMessagingChannel(String method) {
        return method != null && CHANNELS.contains(method.trim().toUpperCase(Locale.ROOT));
    }

    public SendResult sendReportReady(String channel, String phone, String labName, String patientName,
                                      String reportNumber, String verificationToken) {
        // NOT /app/verify/... — that path is the authenticated app shell (login-gated); a real
        // patient receiving this SMS has no LabOS account. /verify/... is the public, standalone
        // route (see frontend VerifyReportPage's javadoc for the live bug this fixed).
        String link = publicUrl.replaceAll("/+$", "") + "/verify/" + verificationToken;
        String text = "Dear " + patientName + ", your lab report " + reportNumber + " from " + labName
                + " is ready. View & verify: " + link;

        String normalized = channel.trim().toUpperCase(Locale.ROOT);
        if (normalized.equals("SMS")) {
            var r = smsGateway.send(phone, text);
            return new SendResult(r.sent(), r.providerReference(), r.errorMessage());
        }
        if (normalized.equals("WHATSAPP")) {
            var r = whatsAppGateway.send(phone, text);
            return new SendResult(r.sent(), r.providerReference(), r.errorMessage());
        }
        throw new IllegalArgumentException("Unsupported messaging channel: " + channel);
    }
}
