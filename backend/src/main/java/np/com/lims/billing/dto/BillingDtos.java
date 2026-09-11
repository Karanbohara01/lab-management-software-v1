package np.com.lims.billing.dto;

import np.com.lims.patient.PatientPrivacy;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import np.com.lims.billing.entity.Invoice;
import np.com.lims.billing.entity.InvoiceItem;
import np.com.lims.billing.entity.InvoiceStatus;
import np.com.lims.billing.entity.Payment;
import np.com.lims.billing.entity.PaymentMethod;
import np.com.lims.billing.entity.PaymentStatus;
import np.com.lims.billing.entity.Refund;
import np.com.lims.billing.entity.RefundStatus;
import np.com.lims.order.entity.DiscountType;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public final class BillingDtos {

    private BillingDtos() {
    }

    // ----- requests ---------------------------------------------------

    public record CreateInvoiceRequest(@NotNull Long orderId) {
    }

    public record AdjustInvoiceRequest(
            @NotNull DiscountType discountType,
            @PositiveOrZero @DecimalMin("0.0") BigDecimal discountValue,
            @PositiveOrZero @DecimalMin("0.0") BigDecimal taxRate,
            @Size(max = 1000) String notes
    ) {
    }

    public record CancelRequest(@NotBlank @Size(max = 500) String reason) {
    }

    public record PaymentRequest(
            @NotNull @Positive BigDecimal amount,
            @NotNull PaymentMethod method,
            @Size(max = 120) String reference,
            @Size(max = 500) String note
    ) {
    }

    public record RefundRequest(
            @NotNull @Positive BigDecimal amount,
            @NotBlank @Size(max = 500) String reason,
            Long paymentId
    ) {
    }

    public record RefundDecisionRequest(@Size(max = 500) String note) {
    }

    // ----- responses ------------------------------------------------

    public record ItemDto(Long id, String testCode, String testName, BigDecimal unitPrice, int quantity,
                          BigDecimal lineDiscount, BigDecimal lineTotal) {
        static ItemDto from(InvoiceItem i) {
            return new ItemDto(i.getId(), i.getTestCode(), i.getTestName(), i.getUnitPrice(), i.getQuantity(),
                    i.getLineDiscount(), i.getLineTotal());
        }
    }

    public record PaymentDto(Long id, BigDecimal amount, PaymentMethod method, String reference, String note,
                             String receivedBy, Instant receivedAt, boolean reversed) {
        public static PaymentDto from(Payment p) {
            return new PaymentDto(p.getId(), p.getAmount(), p.getMethod(), p.getReference(), p.getNote(),
                    p.getReceivedBy(), p.getReceivedAt(), p.isReversed());
        }
    }

    public record RefundDto(Long id, Long invoiceId, String invoiceNumber, Long patientId, String patientName,
                            BigDecimal amount, String reason, RefundStatus status, Long paymentId,
                            String requestedBy, Instant requestedAt, String decidedBy, Instant decidedAt,
                            String decisionNote) {
        public static RefundDto from(Refund r) {
            return new RefundDto(r.getId(), r.getInvoice().getId(), r.getInvoice().getInvoiceNumber(),
                    r.getInvoice().getPatient().getId(), PatientPrivacy.displayName(r.getInvoice().getPatient()),
                    r.getAmount(), r.getReason(), r.getStatus(),
                    r.getPayment() == null ? null : r.getPayment().getId(),
                    r.getRequestedBy(), r.getRequestedAt(), r.getDecidedBy(), r.getDecidedAt(), r.getDecisionNote());
        }
    }

    /**
     * One row of the Sales Book report (Anusuchi-7 of the e-invoice procedure). This system has
     * no per-item tax-exemption or export-sales tracking, so {@code nonTaxableSales} and
     * {@code exportSales} are honestly always zero here — every recorded sale is either fully
     * taxable (taxRate > 0) or, if the lab has no tax configured at all, its {@code taxableSales}
     * is zero and {@code totalSales} carries the full amount. Never fabricated as split figures
     * this system doesn't actually track.
     */
    /**
     * One row of the "master bill" report (Anusuchi-5 of the e-invoice procedure) — every bill
     * ever issued (including later-cancelled ones, per {@code isBillActive}) with its full
     * lifecycle status in one place. {@code customerPan} and {@code vatRefundAmount} are
     * honestly always null/zero: this system has no patient-PAN capture and no payment-gateway
     * integration to compute a VAT refund from, never fabricated as if they were tracked.
     */
    public record MasterBillRow(
            String fiscalYear, String billNo, String customerName, String customerPan, Instant billDate,
            BigDecimal amount, BigDecimal discount, BigDecimal taxableAmount, BigDecimal taxAmount, BigDecimal totalAmount,
            String syncWithIrd, boolean isBillPrinted, boolean isBillActive,
            Instant printedTime, String enteredBy, String printedBy, Boolean isRealtime,
            String paymentMethod, BigDecimal vatRefundAmount, String transactionId
    ) {
        public static MasterBillRow from(Invoice i, np.com.lims.ird.entity.IrdSubmission submission) {
            String lastPaymentMethod = i.getPayments().isEmpty() ? null
                    : i.getPayments().get(i.getPayments().size() - 1).getMethod().name();
            return new MasterBillRow(
                    i.getFiscalYear(), i.getInvoiceNumber(), PatientPrivacy.displayName(i.getPatient()), null,
                    i.getIssuedAt(),
                    i.getSubtotal(), i.getDiscountAmount(), i.getTaxableAmount(), i.getTaxAmount(), i.getTotalAmount(),
                    submission == null ? "NOT_TRACKED" : submission.getStatus().name(),
                    i.getPrintCount() > 0, i.getStatus() != InvoiceStatus.CANCELLED,
                    i.getLastPrintedAt(), i.getIssuedBy(), i.getLastPrintedBy(),
                    submission != null && submission.getStatus().isTerminalSuccess() ? Boolean.TRUE : null,
                    lastPaymentMethod, BigDecimal.ZERO,
                    submission == null ? null : submission.getProviderReference());
        }
    }

    /**
     * One row of the standalone "corrections" report (दफा ६(ठ) of the e-invoice procedure):
     * every bill that was cancelled — its validity ended, per that clause's requirement — plus
     * whether/how it was reversed with IRD if it had already been filed there. Distinct from the
     * general audit log, which mixes every kind of action together rather than isolating
     * corrections specifically.
     */
    public record CorrectionRow(
            String billNo, String customerName, BigDecimal totalAmount,
            Instant cancelledAt, String cancelledBy, String cancelReason,
            String creditNoteStatus, String creditNoteNumber
    ) {
        public static CorrectionRow from(Invoice i, np.com.lims.ird.entity.IrdSubmission submission) {
            return new CorrectionRow(
                    i.getInvoiceNumber(), PatientPrivacy.displayName(i.getPatient()), i.getTotalAmount(),
                    i.getCancelledAt(), i.getCancelledBy(), i.getCancelReason(),
                    submission == null ? null : submission.getCreditNoteStatus().name(),
                    submission == null ? null : submission.getCreditNoteNumber());
        }
    }

    public record SalesBookRow(
            Instant date, String billNo, String buyerName, String buyerPan,
            BigDecimal totalSales, BigDecimal nonTaxableSales, BigDecimal exportSales,
            BigDecimal discount, BigDecimal taxableSales, BigDecimal tax
    ) {
        public static SalesBookRow from(Invoice i) {
            boolean taxable = i.getTaxAmount().signum() > 0;
            return new SalesBookRow(
                    i.getIssuedAt(), i.getInvoiceNumber(), PatientPrivacy.displayName(i.getPatient()), null,
                    i.getTotalAmount(), BigDecimal.ZERO, BigDecimal.ZERO,
                    i.getDiscountAmount(),
                    taxable ? i.getTaxableAmount() : BigDecimal.ZERO,
                    i.getTaxAmount());
        }
    }

    public record ListItem(Long id, String invoiceNumber, Long orderId, String orderNumber,
                           Long patientId, String patientName, String patientMrn,
                           InvoiceStatus status, PaymentStatus paymentStatus,
                           BigDecimal totalAmount, BigDecimal balance, Instant createdAt) {
        public static ListItem from(Invoice i) {
            return new ListItem(i.getId(), i.getInvoiceNumber(), i.getOrder().getId(), i.getOrder().getOrderNumber(),
                    i.getPatient().getId(), PatientPrivacy.displayName(i.getPatient()), i.getPatient().getMrn(),
                    i.getStatus(), i.paymentStatus(), i.getTotalAmount(), i.balance(), i.getCreatedAt());
        }
    }

    public record Detail(
            Long id, String invoiceNumber, String fiscalYear, Long orderId, String orderNumber,
            Long patientId, String patientName, String patientMrn, String patientGender, Integer patientAgeYears,
            String patientPhone, String patientAddress,
            InvoiceStatus status, PaymentStatus paymentStatus,
            BigDecimal subtotal, DiscountType discountType, BigDecimal discountValue, BigDecimal discountAmount,
            BigDecimal taxableAmount, BigDecimal taxRate, BigDecimal taxAmount, BigDecimal totalAmount,
            BigDecimal amountPaid, BigDecimal amountRefunded, BigDecimal balance,
            String notes, String cancelReason, Instant cancelledAt, String cancelledBy,
            Instant issuedAt, String issuedBy,
            int printCount, Instant lastPrintedAt, String lastPrintedBy,
            String labName, String labAddress, String labPhone, String labEmail, String labPan, String labLogoDataUri,
            List<ItemDto> items, List<PaymentDto> payments, List<RefundDto> refunds
    ) {
        /** For contexts (e.g. audit before/after snapshots) that don't have the lab profile handy. */
        public static Detail from(Invoice i) {
            return from(i, null);
        }

        public static Detail from(Invoice i, np.com.lims.settings.entity.LaboratoryProfile lab) {
            return new Detail(
                    i.getId(), i.getInvoiceNumber(), i.getFiscalYear(), i.getOrder().getId(), i.getOrder().getOrderNumber(),
                    i.getPatient().getId(), PatientPrivacy.displayName(i.getPatient()), i.getPatient().getMrn(),
                    i.getPatient().getGender().name(), i.getPatient().ageYears(),
                    i.getPatient().getPhone(), addressLine(i.getPatient().getAddress()),
                    i.getStatus(), i.paymentStatus(),
                    i.getSubtotal(), i.getDiscountType(), i.getDiscountValue(), i.getDiscountAmount(),
                    i.getTaxableAmount(), i.getTaxRate(), i.getTaxAmount(), i.getTotalAmount(),
                    i.getAmountPaid(), i.getAmountRefunded(), i.balance(),
                    i.getNotes(), i.getCancelReason(), i.getCancelledAt(), i.getCancelledBy(),
                    i.getIssuedAt(), i.getIssuedBy(),
                    i.getPrintCount(), i.getLastPrintedAt(), i.getLastPrintedBy(),
                    lab == null ? null : lab.getName(),
                    lab == null ? null : lab.getAddressLine(),
                    lab == null ? null : lab.getPhone(),
                    lab == null ? null : lab.getEmail(),
                    lab == null ? null : lab.getPanNumber(),
                    lab == null ? null : lab.getLogoDataUri(),
                    i.getItems().stream().map(ItemDto::from).toList(),
                    i.getPayments().stream().map(PaymentDto::from).toList(),
                    i.getRefunds().stream().map(RefundDto::from).toList());
        }

        private static String addressLine(np.com.lims.patient.entity.Address a) {
            if (a == null) {
                return null;
            }
            StringBuilder sb = new StringBuilder();
            appendPart(sb, a.getTole());
            appendPart(sb, a.getWardNo() == null || a.getWardNo().isBlank() ? null : "Ward " + a.getWardNo());
            appendPart(sb, a.getMunicipality());
            appendPart(sb, a.getDistrict());
            String result = sb.toString();
            return result.isBlank() ? null : result;
        }

        private static void appendPart(StringBuilder sb, String part) {
            if (part == null || part.isBlank()) {
                return;
            }
            if (sb.length() > 0) {
                sb.append(", ");
            }
            sb.append(part);
        }
    }
}
