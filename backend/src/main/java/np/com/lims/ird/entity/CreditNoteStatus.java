package np.com.lims.ird.entity;

/** Whether an invoice's IRD/CBMS bill filing needs to be reversed with a credit note. */
public enum CreditNoteStatus {
    /** The bill was never successfully filed with IRD (or the invoice isn't cancelled) — nothing to reverse. */
    NOT_NEEDED,
    /** The bill WAS filed and the invoice is now cancelled — a credit note must be filed. */
    NEEDED,
    /** Last credit-note attempt failed; a retry is allowed. */
    FAILED,
    /** IRD accepted the credit note. */
    FILED
}
