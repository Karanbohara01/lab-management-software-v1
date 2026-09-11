package np.com.lims.messaging.gateway;

/**
 * Port for sending a plain-text SMS to a patient's phone.
 *
 * <p>The application depends only on this interface — sending is an explicit, separately
 * triggered action so a slow or failing SMS provider can never block report release.
 *
 * <h2>Implementing a real gateway</h2>
 * <ol>
 *   <li>Sign up with an SMS aggregator that serves Nepal (e.g. Sparrow SMS) and obtain a token.</li>
 *   <li>Call their HTTP API with the token, sender id and message; map the response to a
 *       {@link Result} (treat any non-success response as {@link Result.Status#TRANSPORT_ERROR}).</li>
 *   <li>Register the implementation as the {@code SmsGateway} bean and set {@code lims.sms.enabled=true}
 *       plus the provider's credentials.</li>
 * </ol>
 *
 * <p>Until that is done the {@link UnconfiguredSmsGateway} is active and nothing is transmitted.
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
