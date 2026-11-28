package np.com.lims.pharmacy.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import np.com.lims.pharmacy.entity.PharmacyDosageForm;
import np.com.lims.pharmacy.entity.PharmacyItemCategory;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public final class PharmacyDtos {

    private PharmacyDtos() {}

    public record ItemDto(
            Long id,
            String name,
            String genericName,
            PharmacyItemCategory category,
            PharmacyDosageForm dosageForm,
            String strength,
            String manufacturer,
            String packUnit,
            String dispensingUnit,
            Integer packSize,
            String hsCode,
            Boolean isVatApplicable,
            BigDecimal vatPercentage,
            String schedule,
            String rackLocation,
            Integer minStockLevel,
            Boolean isActive,
            Boolean isNarcotic,
            Boolean requiresPrescription,
            String barcode,
            Integer totalStockUnits,
            Integer totalStockPacks,
            BigDecimal latestMrpPerPack,
            BigDecimal latestUnitMrp
    ) {}

    public record CreateItemRequest(
            @NotBlank String name,
            String genericName,
            PharmacyItemCategory category,
            PharmacyDosageForm dosageForm,
            String strength,
            String manufacturer,
            String packUnit,
            String dispensingUnit,
            Integer packSize,
            String hsCode,
            Boolean isVatApplicable,
            BigDecimal vatPercentage,
            String schedule,
            String rackLocation,
            Integer minStockLevel,
            Boolean isNarcotic,
            Boolean requiresPrescription,
            String barcode
    ) {}

    public record BatchDto(
            Long id,
            Long itemId,
            String itemName,
            String genericName,
            Long wholesalerId,
            String wholesalerName,
            String batchNumber,
            LocalDate mfgDate,
            LocalDate expiryDate,
            Integer packSize,
            Integer initialUnits,
            Integer remainingUnits,
            Integer remainingPacks,
            Integer remainingLooseUnits,
            BigDecimal purchaseRatePerPack,
            BigDecimal effectiveCostPerUnit,
            BigDecimal mrpPerPack,
            BigDecimal unitMrp,
            BigDecimal wholesaleRatePerPack,
            String rackLocation,
            Boolean isExpired,
            Boolean isExpiringSoon
    ) {}

    public record WholesalerDto(
            Long id,
            String name,
            String contactPerson,
            String phone,
            String email,
            String address,
            String panVatNumber,
            String ddaRegistrationNo,
            Integer creditPeriodDays,
            Boolean isActive
    ) {}

    public record CreateWholesalerRequest(
            @NotBlank String name,
            String contactPerson,
            String phone,
            String email,
            String address,
            String panVatNumber,
            String ddaRegistrationNo,
            Integer creditPeriodDays
    ) {}

    public record ResellerDto(
            Long id,
            String name,
            String contactPerson,
            String phone,
            String email,
            String address,
            String panVatNumber,
            BigDecimal discountPercentage,
            BigDecimal creditLimit,
            BigDecimal currentBalance,
            Boolean isActive
    ) {}

    public record CreateResellerRequest(
            @NotBlank String name,
            String contactPerson,
            String phone,
            String email,
            String address,
            String panVatNumber,
            BigDecimal discountPercentage,
            BigDecimal creditLimit
    ) {}

    public record PurchaseItemRequest(
            @NotNull Long itemId,
            @NotBlank String batchNumber,
            LocalDate mfgDate,
            @NotNull LocalDate expiryDate,
            Integer packSize,
            @NotNull Integer billedPackQty,
            Integer freePackQty,
            @NotNull BigDecimal purchaseRatePerPack,
            BigDecimal discountPercentage,
            Boolean isVatApplicable,
            BigDecimal vatPercentage,
            @NotNull BigDecimal mrpPerPack,
            BigDecimal wholesaleRatePerPack
    ) {}

    public record CreatePurchaseRequest(
            @NotNull Long wholesalerId,
            @NotBlank String wholesalerInvoiceNo,
            @NotNull LocalDate invoiceDate,
            LocalDate receivedDate,
            BigDecimal carrierCharges,
            BigDecimal otherCharges,
            String notes,
            @NotNull List<PurchaseItemRequest> items
    ) {}

    public record PurchaseSummaryDto(
            Long id,
            String purchaseNumber,
            Long wholesalerId,
            String wholesalerName,
            String wholesalerInvoiceNo,
            LocalDate invoiceDate,
            LocalDate receivedDate,
            BigDecimal subtotal,
            BigDecimal discountAmount,
            BigDecimal carrierCharges,
            BigDecimal vatAmount,
            BigDecimal netTotal,
            String paymentStatus,
            int itemCount
    ) {}

    public record DispenseItemRequest(
            @NotNull Long itemId,
            Long batchId, // null = auto-select FEFO
            String unitType, // "PACK" or "UNIT"
            @NotNull Integer quantity,
            String dosageInstruction
    ) {}

    public record CreateDispenseRequest(
            String saleType, // "RETAIL" or "RESELLER_WHOLESALE"
            Long patientId,
            @NotBlank String customerName,
            String customerPhone,
            Long doctorId,
            String doctorName,
            Long resellerId,
            String paymentMethod,
            BigDecimal paidAmount,
            Integer refillReminderDays,
            String notes,
            @NotNull List<DispenseItemRequest> items
    ) {}

    public record SaleReceiptItemDto(
            Long id,
            Long itemId,
            String itemName,
            String genericName,
            String batchNumber,
            LocalDate expiryDate,
            String unitType,
            Integer quantity,
            Integer unitsDeducted,
            Integer returnedQuantity,
            BigDecimal unitPrice,
            Boolean isVatApplicable,
            BigDecimal vatAmount,
            BigDecimal totalPrice,
            String dosageInstruction
    ) {}

    public record SaleReceiptDto(
            Long id,
            String invoiceNumber,
            String saleType,
            Long patientId,
            String customerName,
            String customerPhone,
            Long doctorId,
            String doctorName,
            Long resellerId,
            String resellerName,
            BigDecimal subtotal,
            BigDecimal discountAmount,
            BigDecimal taxableAmount,
            BigDecimal nonTaxableAmount,
            BigDecimal vatAmount,
            BigDecimal netTotal,
            BigDecimal paidAmount,
            BigDecimal changeAmount,
            BigDecimal returnedAmount,
            String returnStatus,
            String paymentMethod,
            String status,
            Integer refillReminderDays,
            String notes,
            Instant createdAt,
            List<SaleReceiptItemDto> items
    ) {}

    public record ReturnLineItemRequest(
            @NotNull Long saleItemId,
            @NotNull @Min(1) Integer returnQuantity
    ) {}

    public record CreateSaleReturnRequest(
            @NotNull Long saleId,
            @NotBlank String returnReason,
            String refundMethod,
            String notes,
            @NotNull List<ReturnLineItemRequest> items
    ) {}

    public record SaleReturnItemDto(
            Long id,
            Long saleItemId,
            Long itemId,
            String itemName,
            String batchNumber,
            LocalDate expiryDate,
            String unitType,
            Integer returnQuantity,
            Integer unitsRestored,
            BigDecimal unitPrice,
            Boolean isVatApplicable,
            BigDecimal vatAmount,
            BigDecimal totalRefund
    ) {}

    public record SaleReturnDto(
            Long id,
            String creditNoteNumber,
            Long saleId,
            String originalInvoiceNumber,
            String customerName,
            String customerPhone,
            Long patientId,
            String returnReason,
            String refundMethod,
            BigDecimal subtotal,
            BigDecimal taxableAmount,
            BigDecimal nonTaxableAmount,
            BigDecimal vatAmount,
            BigDecimal netRefundAmount,
            String notes,
            Instant createdAt,
            List<SaleReturnItemDto> items
    ) {}

    public record SupplierReturnItemRequest(
            @NotNull Long batchId,
            @NotNull @Min(1) Integer packQuantity
    ) {}

    public record CreateSupplierReturnRequest(
            @NotNull Long wholesalerId,
            @NotBlank String reason,
            String notes,
            @NotNull List<SupplierReturnItemRequest> items
    ) {}

    public record SupplierReturnItemDto(
            Long id,
            Long itemId,
            String itemName,
            Long batchId,
            String batchNumber,
            LocalDate expiryDate,
            Integer packQuantity,
            BigDecimal ratePerPack,
            BigDecimal lineTotal
    ) {}

    public record SupplierReturnDto(
            Long id,
            String debitNoteNumber,
            Long wholesalerId,
            String wholesalerName,
            LocalDate returnDate,
            String reason,
            BigDecimal totalAmount,
            String notes,
            Instant createdAt,
            List<SupplierReturnItemDto> items
    ) {}

    public record PharmacyDashboardStats(
            long totalMedicines,
            long lowStockCount,
            long expiringIn30DaysCount,
            long expiredCount,
            long todaySalesCount,
            BigDecimal todaySalesAmount,
            BigDecimal monthSalesAmount
    ) {}

    public record RecordNarcoticLogRequest(
            @NotNull Long itemId,
            @NotNull Long batchId,
            Long saleId,
            Long saleItemId,
            Long patientId,
            @NotBlank String patientName,
            String patientAgeGender,
            String patientAddress,
            @NotBlank String buyerName,
            String buyerRelation,
            String buyerContact,
            String buyerIdType,
            String buyerIdNumber,
            Long doctorId,
            @NotBlank String doctorName,
            @NotBlank String doctorNmcNumber,
            String prescriptionNumber,
            LocalDate prescriptionDate,
            @NotNull @Min(1) Integer dispensedQuantity,
            String unitType,
            @NotBlank String pharmacistName,
            String pharmacistNpcNumber,
            String remarks
    ) {}

    public record NarcoticLogDto(
            Long id,
            Long itemId,
            String itemName,
            String genericName,
            Long batchId,
            String batchNumber,
            LocalDate expiryDate,
            Long saleId,
            Instant logDate,
            Long patientId,
            String patientName,
            String patientAgeGender,
            String patientAddress,
            String buyerName,
            String buyerRelation,
            String buyerContact,
            String buyerIdType,
            String buyerIdNumber,
            Long doctorId,
            String doctorName,
            String doctorNmcNumber,
            String prescriptionNumber,
            LocalDate prescriptionDate,
            Integer dispensedQuantity,
            String unitType,
            Integer balanceStockUnits,
            String pharmacistName,
            String pharmacistNpcNumber,
            String remarks
    ) {}
}
