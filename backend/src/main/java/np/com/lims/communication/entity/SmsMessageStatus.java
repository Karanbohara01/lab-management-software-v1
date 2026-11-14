package np.com.lims.communication.entity;

/**
 * Where one SMS attempt stands. Deliberately does NOT conflate "the gateway accepted the HTTP
 * request" with "the handset received the message" — see the long comment on {@code sms_message}
 * in migration V75 and {@code SamayaSmsGateway}'s javadoc: no publicly documented Samaya delivery
 * report/webhook mechanism was found, so {@link #DELIVERED} is reachable in code but, honestly,
 * not reachable in practice until/unless Samaya confirms a real delivery-report mechanism.
 */
public enum SmsMessageStatus {
    /** A row exists (e.g. a campaign recipient staged) but sending hasn't been attempted yet. */
    QUEUED,
    /**
     * The gateway's API call returned success for this request. This is the honest resting state
     * for every message that goes out today — "sent, delivery unconfirmed" — never upgraded to
     * {@link #DELIVERED} without a real signal saying so.
     */
    SENT,
    /** A real delivery-confirmation signal was received from the provider. */
    DELIVERED,
    /** The gateway rejected the request, or the call failed before/without a provider response. */
    FAILED
}
