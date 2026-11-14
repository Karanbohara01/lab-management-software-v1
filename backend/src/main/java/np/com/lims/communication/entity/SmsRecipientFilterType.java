package np.com.lims.communication.entity;

/** How a bulk SMS campaign's recipient list was built — kept on the campaign for its report. */
public enum SmsRecipientFilterType {
    ALL_PATIENTS,
    REGISTERED_IN_RANGE,
    VISITED_IN_RANGE,
    UPCOMING_APPOINTMENTS,
    NOT_VISITED_IN_DAYS,
    DEPARTMENT_OR_CATEGORY,
    MANUAL_SELECTION,
    FILE_IMPORT,
    CUSTOM_PHONE_LIST
}
