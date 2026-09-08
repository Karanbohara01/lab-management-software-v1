package np.com.lims.billing.entity;

/** Lifecycle of an invoice document. Payment progress is tracked separately as {@link PaymentStatus}. */
public enum InvoiceStatus {
    /** Editable, no number assigned yet. */
    DRAFT,
    /** Finalised, immutable, has an invoice number; payments may be recorded. */
    ISSUED,
    /** Voided. Only possible before any payment is recorded. */
    CANCELLED
}
