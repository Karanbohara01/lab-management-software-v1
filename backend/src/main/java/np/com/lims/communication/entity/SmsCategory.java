package np.com.lims.communication.entity;

/** What kind of message this is — drives the default template category and the history filter. */
public enum SmsCategory {
    APPOINTMENT,
    REGISTRATION,
    LABORATORY,
    PAYMENT,
    REPORT_READY,
    FOLLOW_UP,
    GENERAL_ANNOUNCEMENT,
    PROMOTIONAL,
    CUSTOM
}
