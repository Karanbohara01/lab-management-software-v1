package np.com.lims.patientimport.entity;

/** What became of one spreadsheet row. Every row of the file gets one of these — none is discarded silently. */
public enum ImportRowStatus {

    /** Staged, not yet looked at. */
    PENDING,

    /** Passes validation and matches no existing patient. Will be imported. */
    VALID,

    /** Fails validation. Will never be imported; the reason and the offending field are recorded. */
    INVALID,

    /** Matches an existing patient. What happens next depends on the duplicate policy chosen. */
    DUPLICATE,

    /** Matches an earlier row of this same file rather than anything in the database. */
    DUPLICATE_IN_FILE,

    /**
     * Shares only a name, gender and age with an existing patient. Too weak to act on alone — two
     * people with the same common name and age are ordinary — but too strong to pass in silence,
     * so it is shown for review and given its own policy.
     */
    POSSIBLE_DUPLICATE,

    /** A patient was created from this row. Carries that patient's id, which is what makes a retry safe. */
    IMPORTED,

    /** An existing patient's blank fields were filled in from this row. */
    UPDATED,

    /** Deliberately not imported — a duplicate under a skip policy, or a row left behind by a cancellation. */
    SKIPPED,

    /** Passed validation but the insert itself failed. Recorded with the reason so it can be retried. */
    FAILED;

    /** True once this row has had its final outcome and must never be processed again. */
    public boolean isSettled() {
        return this == IMPORTED || this == UPDATED || this == SKIPPED || this == FAILED || this == INVALID;
    }
}
