package np.com.lims.order.dto;

import np.com.lims.patient.PatientPrivacy;
import np.com.lims.patient.entity.Gender;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import np.com.lims.order.OrderPricingCalculator;
import np.com.lims.order.entity.DiscountType;
import np.com.lims.order.entity.LabOrder;
import np.com.lims.order.entity.LabOrderItem;
import np.com.lims.order.entity.OrderItemStatus;
import np.com.lims.order.entity.OrderStatus;
import np.com.lims.common.model.Priority;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public final class OrderDtos {

    private OrderDtos() {
    }

    // ----- requests -----------------------------------------------------

    public record ItemRequest(
            @NotNull Long testId,
            @Min(1) int quantity,
            @PositiveOrZero BigDecimal lineDiscount
    ) {
    }

    public record SaveRequest(
            @NotNull Long patientId,
            Long referringDoctorId,
            Long branchId,
            Long prescriptionDocumentId,
            @Size(max = 1000) String clinicalNotes,
            Priority priority,
            @NotEmpty @Valid List<ItemRequest> items,
            @NotNull DiscountType discountType,
            @PositiveOrZero @DecimalMin("0.0") BigDecimal discountValue,
            @PositiveOrZero @DecimalMin("0.0") BigDecimal taxRate,
            boolean confirm
    ) {
        public SaveRequest(Long patientId, Long referringDoctorId, Long branchId, String clinicalNotes, Priority priority,
                           List<ItemRequest> items, DiscountType discountType, BigDecimal discountValue, BigDecimal taxRate, boolean confirm) {
            this(patientId, referringDoctorId, branchId, null, clinicalNotes, priority, items, discountType, discountValue, taxRate, confirm);
        }
    }

    public record PreviewRequest(
            @NotEmpty @Valid List<ItemRequest> items,
            @NotNull DiscountType discountType,
            @PositiveOrZero BigDecimal discountValue,
            @PositiveOrZero BigDecimal taxRate
    ) {
    }

    public record CancelRequest(
            @Size(max = 500) String reason
    ) {
    }

    // ----- responses --------------------------------------------------

    public record Pricing(
            BigDecimal subtotal,
            DiscountType discountType,
            BigDecimal discountValue,
            BigDecimal discountAmount,
            BigDecimal taxableAmount,
            BigDecimal taxRate,
            BigDecimal taxAmount,
            BigDecimal totalAmount
    ) {
        public static Pricing from(LabOrder o) {
            return new Pricing(o.getSubtotal(), o.getDiscountType(), o.getDiscountValue(), o.getDiscountAmount(),
                    o.getTaxableAmount(), o.getTaxRate(), o.getTaxAmount(), o.getTotalAmount());
        }

        public static Pricing from(OrderPricingCalculator.Result r) {
            return new Pricing(r.subtotal(), r.discountType(), r.discountValue(), r.discountAmount(),
                    r.taxableAmount(), r.taxRate(), r.taxAmount(), r.totalAmount());
        }
    }

    public record ItemResponse(
            Long id,
            Long testId,
            String testCode,
            String testName,
            String departmentName,
            BigDecimal unitPrice,
            int quantity,
            BigDecimal lineDiscount,
            BigDecimal lineTotal,
            OrderItemStatus status
    ) {
        static ItemResponse from(LabOrderItem i) {
            return new ItemResponse(i.getId(), i.getTest().getId(), i.getTestCode(), i.getTestName(),
                    i.getDepartmentName(), i.getUnitPrice(), i.getQuantity(), i.getLineDiscount(),
                    i.getLineTotal(), i.getStatus());
        }
    }

    public record PrescriptionSummary(
            Long id,
            String title,
            String fileName,
            String fileType,
            long fileSizeBytes,
            String documentType,
            String documentDate,
            String doctorOrFacility
    ) {
        public static PrescriptionSummary from(np.com.lims.patient.entity.PatientDocument doc) {
            if (doc == null) return null;
            return new PrescriptionSummary(
                    doc.getId(),
                    doc.getTitle(),
                    doc.getFileName(),
                    doc.getFileType(),
                    doc.getFileSizeBytes(),
                    doc.getDocumentType() == null ? null : doc.getDocumentType().name(),
                    doc.getDocumentDate() == null ? null : doc.getDocumentDate().toString(),
                    doc.getDoctorOrFacility()
            );
        }
    }

    public record ListItem(
            Long id,
            String orderNumber,
            Long patientId,
            String patientName,
            String patientMrn,
            Long branchId,
            String branchName,
            OrderStatus status,
            String priority,
            boolean hasPrescription,
            int itemCount,
            BigDecimal totalAmount,
            Instant orderedAt
    ) {
        public static ListItem from(LabOrder o) {
            return new ListItem(o.getId(), o.getOrderNumber(), o.getPatient().getId(), PatientPrivacy.displayName(o.getPatient()),
                    o.getPatient().getMrn(), o.getBranch() == null ? null : o.getBranch().getId(),
                    o.getBranch() == null ? null : o.getBranch().getName(),
                    o.getStatus(), o.getPriority().name(), o.getPrescriptionDocument() != null,
                    o.getItems().size(), o.getTotalAmount(), o.getOrderedAt());
        }
    }

    public record Detail(
            Long id,
            String orderNumber,
            Long patientId,
            String patientName,
            String patientMrn,
            Gender patientGender,
            Integer patientAgeYears,
            String patientPhone,
            Long branchId,
            String branchName,
            Long referringDoctorId,
            String referringDoctorName,
            PrescriptionSummary prescription,
            OrderStatus status,
            String priority,
            String clinicalNotes,
            Instant orderedAt,
            Instant confirmedAt,
            Instant cancelledAt,
            String cancelReason,
            List<ItemResponse> items,
            Pricing pricing
    ) {
        public static Detail from(LabOrder o) {
            return new Detail(
                    o.getId(), o.getOrderNumber(), o.getPatient().getId(), PatientPrivacy.displayName(o.getPatient()),
                    o.getPatient().getMrn(),
                    o.getPatient().getGender(), o.getPatient().ageYears(), o.getPatient().getPhone(),
                    o.getBranch() == null ? null : o.getBranch().getId(),
                    o.getBranch() == null ? null : o.getBranch().getName(),
                    o.getReferringDoctor() == null ? null : o.getReferringDoctor().getId(),
                    o.getReferringDoctor() == null ? null : o.getReferringDoctor().getFullName(),
                    PrescriptionSummary.from(o.getPrescriptionDocument()),
                    o.getStatus(), o.getPriority().name(), o.getClinicalNotes(), o.getOrderedAt(), o.getConfirmedAt(),
                    o.getCancelledAt(), o.getCancelReason(),
                    o.getItems().stream().map(ItemResponse::from).toList(),
                    Pricing.from(o));
        }
    }
}
