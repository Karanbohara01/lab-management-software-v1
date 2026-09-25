package np.com.lims.commission.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import np.com.lims.billing.entity.PaymentMethod;
import np.com.lims.commission.entity.CommissionEntry;
import np.com.lims.commission.entity.CommissionPayout;

import java.math.BigDecimal;
import java.time.Instant;

public final class CommissionDtos {

    private CommissionDtos() {
    }

    public record EntryRow(
            Long id, Long doctorId, String doctorName, Long invoiceId, String invoiceNumber,
            Long orderId, String orderNumber, BigDecimal baseAmount, BigDecimal rate,
            BigDecimal commissionAmount, Instant earnedAt
    ) {
        public static EntryRow from(CommissionEntry e, String doctorName) {
            return new EntryRow(e.getId(), e.getDoctorId(), doctorName, e.getInvoiceId(), e.getInvoiceNumber(),
                    e.getOrderId(), e.getOrderNumber(), e.getBaseAmount(), e.getRate(), e.getCommissionAmount(),
                    e.getEarnedAt());
        }
    }

    public record PayoutRow(
            Long id, Long doctorId, BigDecimal amount, PaymentMethod method, String reference,
            String note, Instant paidAt, String paidBy
    ) {
        public static PayoutRow from(CommissionPayout p) {
            return new PayoutRow(p.getId(), p.getDoctorId(), p.getAmount(), p.getMethod(), p.getReference(),
                    p.getNote(), p.getPaidAt(), p.getPaidBy());
        }
    }

    /** One row per doctor with a nonzero commission rate — earned/paid/outstanding running totals. */
    public record DoctorSummary(
            Long doctorId, String doctorName, BigDecimal commissionRate,
            BigDecimal totalEarned, BigDecimal totalPaid, BigDecimal outstanding
    ) {
    }

    public record PayoutRequest(
            @NotNull Long doctorId,
            @NotNull @DecimalMin(value = "0.01", message = "Amount must be greater than zero") BigDecimal amount,
            @NotNull PaymentMethod method,
            @Size(max = 120) String reference,
            @Size(max = 500) String note
    ) {
    }
}
