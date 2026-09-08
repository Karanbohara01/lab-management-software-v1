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
            InvoiceStatus status, PaymentStatus paymentStatus,
            BigDecimal subtotal, DiscountType discountType, BigDecimal discountValue, BigDecimal discountAmount,
            BigDecimal taxableAmount, BigDecimal taxRate, BigDecimal taxAmount, BigDecimal totalAmount,
            BigDecimal amountPaid, BigDecimal amountRefunded, BigDecimal balance,
            String notes, String cancelReason,
            Instant issuedAt, String issuedBy,
            List<ItemDto> items, List<PaymentDto> payments, List<RefundDto> refunds
    ) {
        public static Detail from(Invoice i) {
            return new Detail(
                    i.getId(), i.getInvoiceNumber(), i.getFiscalYear(), i.getOrder().getId(), i.getOrder().getOrderNumber(),
                    i.getPatient().getId(), PatientPrivacy.displayName(i.getPatient()), i.getPatient().getMrn(),
                    i.getPatient().getGender().name(), i.getPatient().ageYears(),
                    i.getStatus(), i.paymentStatus(),
                    i.getSubtotal(), i.getDiscountType(), i.getDiscountValue(), i.getDiscountAmount(),
                    i.getTaxableAmount(), i.getTaxRate(), i.getTaxAmount(), i.getTotalAmount(),
                    i.getAmountPaid(), i.getAmountRefunded(), i.balance(),
                    i.getNotes(), i.getCancelReason(),
                    i.getIssuedAt(), i.getIssuedBy(),
                    i.getItems().stream().map(ItemDto::from).toList(),
                    i.getPayments().stream().map(PaymentDto::from).toList(),
                    i.getRefunds().stream().map(RefundDto::from).toList());
        }
    }
}
