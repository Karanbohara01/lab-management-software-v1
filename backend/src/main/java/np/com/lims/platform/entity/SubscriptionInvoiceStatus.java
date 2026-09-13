package np.com.lims.platform.entity;

public enum SubscriptionInvoiceStatus {
    /** Issued, not yet paid, still within its due date. */
    PENDING,
    /** Paid — the gateway verified the payment server-to-server. */
    PAID,
    /** Past its due date and still unpaid. Triggers organization suspension after a further grace period. */
    OVERDUE,
    /** Superseded (e.g. plan changed before payment) or written off by a platform admin. */
    CANCELLED
}
