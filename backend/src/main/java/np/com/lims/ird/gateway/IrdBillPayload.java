package np.com.lims.ird.gateway;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * Neutral, internal representation of an invoice to be filed with IRD / CBMS.
 *
 * <p><b>This is NOT the official IRD request schema.</b> A real gateway implementation is
 * responsible for translating this payload into whatever the verified IRD CBMS API requires
 * (field names, formats, digital signature, seller enrolment id, etc.). Do not assume any
 * field here maps 1:1 to an IRD field.
 */
public record IrdBillPayload(
        String invoiceNumber,
        String fiscalYear,
        Instant issuedAt,
        String sellerName,
        String sellerPan,
        String buyerName,
        String buyerPan,
        BigDecimal subtotal,
        BigDecimal discountAmount,
        BigDecimal taxableAmount,
        BigDecimal taxAmount,
        BigDecimal totalAmount,
        List<Line> lines
) {
    public record Line(String description, int quantity, BigDecimal unitPrice, BigDecimal lineTotal) {
    }
}
