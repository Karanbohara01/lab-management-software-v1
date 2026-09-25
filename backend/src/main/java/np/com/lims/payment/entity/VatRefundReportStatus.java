package np.com.lims.payment.entity;

/** Status of the दफा ६(त) / Anusuchi-8 VAT-refund report for one verified {@link OnlinePayment}. */
public enum VatRefundReportStatus {
    /** Payment was never verified, so nothing to report. */
    NOT_APPLICABLE,
    /** Reported to the payment provider successfully. */
    SENT,
    /** The provider call failed (transport error, rejection, etc). */
    FAILED,
    /** The provider doesn't yet implement this reporting call — see {@code PaymentGateway#reportVatRefund}. */
    NOT_SUPPORTED
}
