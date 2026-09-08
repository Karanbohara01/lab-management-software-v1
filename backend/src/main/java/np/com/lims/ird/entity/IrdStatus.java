package np.com.lims.ird.entity;

import java.util.Set;

/**
 * State of an invoice's IRD / CBMS e-billing submission. These are our internal tracking states;
 * they are mapped to whatever the verified IRD integration actually reports once one is configured.
 */
public enum IrdStatus {
    /** Tracking row exists; nothing has been sent. */
    NOT_SUBMITTED,
    /** A submission attempt is in progress. */
    PENDING,
    /** Sent (or recorded as manually filed) and awaiting/assumed provider acknowledgement. */
    SUBMITTED,
    /** Provider acknowledged the bill. */
    ACCEPTED,
    /** Last attempt failed; a retry is allowed. */
    FAILED,
    /** Provider reports the bill already exists — do NOT resubmit. */
    DUPLICATE,
    /** Submission abandoned (e.g. the invoice was cancelled). */
    CANCELLED;

    private static final Set<IrdStatus> SUBMITTABLE = Set.of(NOT_SUBMITTED, FAILED);

    /** Guards against duplicate submissions: only a fresh or previously-failed row may be (re)sent. */
    public boolean canSubmit() {
        return SUBMITTABLE.contains(this);
    }

    public boolean isTerminalSuccess() {
        return this == ACCEPTED || this == DUPLICATE;
    }
}
