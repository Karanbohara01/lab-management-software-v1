package np.com.lims.communication.entity;

/**
 * The lifecycle events an automation rule can fire on. Every value except {@link #APPOINTMENT_REMINDER}
 * and {@link #FOLLOW_UP_DUE} is wired synchronously from inside the triggering service, right
 * alongside the existing audit-log call (this codebase has no application-event-bus — every
 * cross-cutting concern here is a direct, explicit method call; see
 * {@code SmsAutomationTriggerService} for every call site). Those two are fired by scheduled
 * sweeps instead, since there is no single "the moment this becomes true" action to hang off of —
 * see {@code SmsReminderSweep}.
 */
public enum SmsAutomationEvent {
    PATIENT_REGISTERED,
    APPOINTMENT_BOOKED,
    APPOINTMENT_RESCHEDULED,
    APPOINTMENT_CANCELLED,
    /** Fired by a scheduled sweep a configurable number of hours before the appointment. */
    APPOINTMENT_REMINDER,
    LAB_ORDER_CONFIRMED,
    REPORT_READY,
    /** Fired once a payment brings an invoice's balance to zero — not on every partial payment. */
    PAYMENT_COMPLETED,
    /** Fired by a scheduled sweep when a {@code PatientFollowUp}'s due date arrives. */
    FOLLOW_UP_DUE
}
