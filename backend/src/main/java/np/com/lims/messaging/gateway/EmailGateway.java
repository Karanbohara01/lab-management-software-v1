package np.com.lims.messaging.gateway;

/**
 * Port for sending a plain-text transactional email (currently: password-reset links only).
 *
 * <p>{@link SmtpEmailGateway} is the real implementation, active by default — set
 * {@code lims.mail.enabled=true} plus {@code spring.mail.host} (and credentials) to use it; until
 * both are set, every send honestly fails rather than pretending to succeed.
 * {@link UnconfiguredEmailGateway} is a dormant fallback of last resort, same pattern as
 * {@link SmsGateway} / {@code WhatsAppGateway}.
 */
public interface EmailGateway {

    /** Human-readable provider label, e.g. {@code "DISABLED"} or {@code "SMTP"}. */
    String provider();

    /** True only when a real, credentialed gateway is wired in. */
    boolean isConfigured();

    Result send(String toEmail, String subject, String textBody);

    record Result(Status status, String errorCode, String errorMessage) {

        public enum Status { SENT, TRANSPORT_ERROR }

        public static Result sent() {
            return new Result(Status.SENT, null, null);
        }

        public static Result transportError(String code, String message) {
            return new Result(Status.TRANSPORT_ERROR, code, message);
        }

        public boolean isSent() {
            return status == Status.SENT;
        }
    }
}
