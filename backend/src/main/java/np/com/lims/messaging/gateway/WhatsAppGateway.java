package np.com.lims.messaging.gateway;

/**
 * Port for sending a WhatsApp text message to a patient.
 *
 * <h2>Implementing a real gateway</h2>
 * <ol>
 *   <li>Register a WhatsApp Business Account, verify the sender number and complete Meta's
 *       business verification.</li>
 *   <li>Call the WhatsApp Cloud API {@code /messages} endpoint with the phone number id and
 *       access token; map the response to a {@link Result}.</li>
 *   <li>Register the implementation as the {@code WhatsAppGateway} bean and set
 *       {@code lims.whatsapp.enabled=true} plus the phone number id / access token.</li>
 * </ol>
 *
 * <p>Until that is done the {@link UnconfiguredWhatsAppGateway} is active and nothing is sent.
 */
public interface WhatsAppGateway {

    /** Human-readable label, e.g. {@code "DISABLED"} or {@code "WhatsApp Cloud API"}. */
    String provider();

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
