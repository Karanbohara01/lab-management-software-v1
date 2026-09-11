package np.com.lims.ird.gateway;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Neutral, internal representation of a credit note (sales return) reversing a previously-filed
 * bill, to be filed with IRD / CBMS via {@code POST /api/billreturn}.
 *
 * <p><b>This is NOT the official IRD request schema.</b> A real gateway implementation is
 * responsible for translating this payload into whatever the verified IRD CBMS API requires.
 */
public record IrdCreditNotePayload(
        String refInvoiceNumber,
        String creditNoteNumber,
        Instant creditNoteDate,
        String reasonForReturn,
        String fiscalYear,
        String sellerName,
        String sellerPan,
        String buyerName,
        String buyerPan,
        BigDecimal subtotal,
        BigDecimal discountAmount,
        BigDecimal taxableAmount,
        BigDecimal taxAmount,
        BigDecimal totalAmount
) {
}
