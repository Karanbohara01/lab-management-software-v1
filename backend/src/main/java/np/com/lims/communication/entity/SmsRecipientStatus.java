package np.com.lims.communication.entity;

/** One campaign recipient row's own status, independent of the campaign's overall status. */
public enum SmsRecipientStatus {
    PENDING,
    SENT,
    FAILED,
    /** Had the same phone number as another recipient already staged in this campaign. */
    SKIPPED_DUPLICATE,
    /** No phone number, or not a recognisable Nepali mobile number. */
    SKIPPED_INVALID,
    /** On the SMS do-not-contact list — see {@code SmsOptOut}. */
    SKIPPED_OPTED_OUT
}
