package np.com.lims.messaging.gateway;

/**
 * Port for sending a WhatsApp text message to a patient. {@link WhatsAppCloudApiGateway} is the
 * real implementation (Meta WhatsApp Business Cloud API), active whenever either this deployment's
 * shared {@code lims.whatsapp.*} config or an organization's own credentials (Settings →
 * Laboratory profile) are fully set; {@link UnconfiguredWhatsAppGateway} is the dormant fallback
 * that keeps every attempt honestly failing when neither is configured.
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
