package np.com.lims.payment.entity;

public enum OnlinePaymentStatus {
    /** Checkout was started; the patient may or may not have completed it yet. */
    INITIATED,
    /** Gateway confirmed success on a server-to-server check; a Payment was recorded. */
    VERIFIED,
    /** Gateway confirmed failure/cancellation, or the server-side verify check itself failed. */
    FAILED
}
