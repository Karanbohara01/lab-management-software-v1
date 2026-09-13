package np.com.lims.messaging.gateway;

/**
 * Port for sending a plain-text SMS to a patient's phone.
 *
 * <p>The application depends only on this interface — sending is an explicit, separately
 * triggered action so a slow or failing SMS provider can never block report release.
 *
 * <p>{@link SparrowSmsGateway} is the real implementation (Sparrow SMS, docs.sparrowsms.com),
 * active by default — see its javadoc for verification status. Set {@code lims.sms.enabled=true}
 * plus credentials (globally in application.yml, or per-organization via Settings — see
 * {@code SmsCredentialsService}) to use it; until either is set, every send honestly fails rather
 * than pretending to succeed. {@link UnconfiguredSmsGateway} is a dormant fallback of last resort.
 */
public interface SmsGateway {

    /** Human-readable provider label, e.g. {@code "DISABLED"} or {@code "Sparrow SMS"}. */
    String provider();

    /** True only when a real, credentialed gateway is wired in. */
    boolean isConfigured();

    Result send(String toPhone, String message);

    record Result(Status status, String providerReference, String errorCode, String errorMessage) {

        public enum Status { SENT, TRANSPORT_ERROR }

        public static Result sent(String reference) {
            return new Result(Status.SENT, reference, null, null);
        }

        public static Result transportError(String code, String message) {
            return new Result(Status.TRANSPORT_ERROR, null, code, message);
        }

        public boolean sent() {
            return status == Status.SENT;
        }
    }
}
