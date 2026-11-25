package np.com.lims.pharmacy.dto;

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
            Long itemId,
            String itemName,
            String genericName,
            String batchNumber,
            LocalDate expiryDate,
            String unitType,
            Integer quantity,
            Integer unitsDeducted,
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
            String paymentMethod,
            String status,
            Integer refillReminderDays,
            String notes,
            Instant createdAt,
            List<SaleReceiptItemDto> items
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
}
