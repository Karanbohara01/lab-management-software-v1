package np.com.lims.inventory.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import np.com.lims.inventory.entity.InventoryBatch;
import np.com.lims.inventory.entity.InventoryItem;
import np.com.lims.inventory.entity.ItemCategory;
import np.com.lims.inventory.entity.PurchaseOrder;
import np.com.lims.inventory.entity.PurchaseOrderItem;
import np.com.lims.inventory.entity.PurchaseOrderStatus;
import np.com.lims.inventory.entity.StockStatus;
import np.com.lims.inventory.entity.StockTransaction;
import np.com.lims.inventory.entity.Supplier;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public final class InventoryDtos {

    private InventoryDtos() {
    }

    // ===== suppliers ===============================================

    public record SupplierRequest(
            @NotBlank @Size(max = 200) String name,
            @Size(max = 160) String contactPerson,
            @Size(max = 48) String phone,
            @Size(max = 160) String email,
            @Size(max = 300) String address,
            @Size(max = 40) String panNumber
    ) {
    }

    public record SupplierResponse(Long id, String name, String contactPerson, String phone, String email,
                                   String address, String panNumber, boolean active) {
        public static SupplierResponse from(Supplier s) {
            return new SupplierResponse(s.getId(), s.getName(), s.getContactPerson(), s.getPhone(), s.getEmail(),
                    s.getAddress(), s.getPanNumber(), s.isActive());
        }
    }

    // ===== items ==================================================

    public record ItemCreateRequest(
            @NotBlank @Size(max = 40) @Pattern(regexp = "[A-Za-z0-9._-]+") String code,
            @NotBlank @Size(max = 200) String name,
            @NotNull ItemCategory category,
            @NotBlank @Size(max = 24) String unit,
            @PositiveOrZero BigDecimal minimumStock,
            Long departmentId,
            @Size(max = 1000) String notes
    ) {
    }

    public record ItemUpdateRequest(
            @NotBlank @Size(max = 200) String name,
            @NotNull ItemCategory category,
            @NotBlank @Size(max = 24) String unit,
            @PositiveOrZero BigDecimal minimumStock,
            Long departmentId,
            @Size(max = 1000) String notes
    ) {
    }

    public record ReceiveStockRequest(
            @NotBlank @Size(max = 80) String batchNumber,
            Long supplierId,
            LocalDate receivedDate,
            LocalDate expiryDate,
            @NotNull @Positive BigDecimal quantity,
            @PositiveOrZero BigDecimal unitCost,
            @Size(max = 500) String notes,
            @Size(max = 120) String reference
    ) {
    }

    public record IssueStockRequest(
            @NotNull @Positive BigDecimal quantity,
            @NotBlank @Size(max = 300) String reason,
            @Size(max = 120) String reference
    ) {
    }

    public record AdjustBatchRequest(
            @NotNull @PositiveOrZero BigDecimal newQuantity,
            @NotBlank @Size(max = 300) String reason
    ) {
    }

    public record DiscardBatchRequest(@NotBlank @Size(max = 300) String reason) {
    }

    public record BatchDto(Long id, String batchNumber, String supplierName, LocalDate receivedDate,
                           LocalDate expiryDate, BigDecimal initialQuantity, BigDecimal remainingQuantity,
                           BigDecimal unitCost, boolean expired, boolean expiringSoon) {
        static BatchDto from(InventoryBatch b, LocalDate today, int alertDays) {
            return new BatchDto(b.getId(), b.getBatchNumber(),
                    b.getSupplier() == null ? null : b.getSupplier().getName(),
                    b.getReceivedDate(), b.getExpiryDate(), b.getInitialQuantity(), b.getRemainingQuantity(),
                    b.getUnitCost(), b.isExpired(today), b.isExpiringWithin(today, alertDays));
        }
    }

    public record TransactionDto(Long id, String type, BigDecimal quantity, BigDecimal balanceAfter,
                                 String batchNumber, String reason, String reference, String performedBy,
                                 Instant occurredAt) {
        public static TransactionDto from(StockTransaction t) {
            return new TransactionDto(t.getId(), t.getType().name(), t.getQuantity(), t.getBalanceAfter(),
                    t.getBatch() == null ? null : t.getBatch().getBatchNumber(), t.getReason(), t.getReference(),
                    t.getPerformedBy(), t.getOccurredAt());
        }
    }

    public record ItemListItem(Long id, String code, String name, ItemCategory category, String unit,
                               BigDecimal quantityOnHand, BigDecimal minimumStock, String departmentName,
                               StockStatus status, boolean active) {
        public static ItemListItem from(InventoryItem i, LocalDate today, int alertDays) {
            return new ItemListItem(i.getId(), i.getCode(), i.getName(), i.getCategory(), i.getUnit(),
                    i.quantityOnHand(), i.getMinimumStock(),
                    i.getDepartment() == null ? null : i.getDepartment().getName(),
                    i.status(today, alertDays), i.isActive());
        }
    }

    public record ItemDetail(Long id, String code, String name, ItemCategory category, String unit,
                             BigDecimal quantityOnHand, BigDecimal minimumStock, Long departmentId,
                             String departmentName, String notes, StockStatus status, boolean active,
                             List<BatchDto> batches) {
        public static ItemDetail from(InventoryItem i, LocalDate today, int alertDays) {
            return new ItemDetail(i.getId(), i.getCode(), i.getName(), i.getCategory(), i.getUnit(),
                    i.quantityOnHand(), i.getMinimumStock(),
                    i.getDepartment() == null ? null : i.getDepartment().getId(),
                    i.getDepartment() == null ? null : i.getDepartment().getName(),
                    i.getNotes(), i.status(today, alertDays), i.isActive(),
                    i.getBatches().stream()
                            .sorted((a, b) -> {
                                if (a.getExpiryDate() == null) return b.getExpiryDate() == null ? 0 : 1;
                                if (b.getExpiryDate() == null) return -1;
                                return a.getExpiryDate().compareTo(b.getExpiryDate());
                            })
                            .map(b -> BatchDto.from(b, today, alertDays)).toList());
        }
    }

    public record InventorySummary(Map<String, Long> statusCounts, List<ItemListItem> alerts) {
    }

    // ===== purchase orders =======================================

    public record PoLineRequest(
            @NotNull Long itemId,
            @NotNull @Positive BigDecimal quantity,
            @PositiveOrZero BigDecimal estimatedUnitCost
    ) {
    }

    public record PoUpsertRequest(
            @NotNull Long supplierId,
            LocalDate expectedDate,
            @Size(max = 1000) String notes,
            @NotEmpty @Valid List<PoLineRequest> lines
    ) {
    }

    public record PoReceiveLine(
            @NotNull Long poItemId,
            @NotBlank @Size(max = 80) String batchNumber,
            LocalDate expiryDate,
            @NotNull @Positive BigDecimal quantity,
            @PositiveOrZero BigDecimal unitCost
    ) {
    }

    public record PoReceiveRequest(@NotEmpty @Valid List<PoReceiveLine> lines) {
    }

    public record PoCancelRequest(@NotBlank @Size(max = 500) String reason) {
    }

    public record PoLineDto(Long id, Long itemId, String itemCode, String itemName, String unit,
                            BigDecimal quantityOrdered, BigDecimal quantityReceived, BigDecimal estimatedUnitCost) {
        static PoLineDto from(PurchaseOrderItem i) {
            return new PoLineDto(i.getId(), i.getItem().getId(), i.getItemCode(), i.getItemName(), i.getUnit(),
                    i.getQuantityOrdered(), i.getQuantityReceived(), i.getEstimatedUnitCost());
        }
    }

    public record PoListItem(Long id, String poNumber, Long supplierId, String supplierName,
                             PurchaseOrderStatus status, int lineCount, LocalDate expectedDate, Instant createdAt) {
        public static PoListItem from(PurchaseOrder p) {
            return new PoListItem(p.getId(), p.getPoNumber(), p.getSupplier().getId(), p.getSupplier().getName(),
                    p.getStatus(), p.getItems().size(), p.getExpectedDate(), p.getCreatedAt());
        }
    }

    public record PoDetail(Long id, String poNumber, Long supplierId, String supplierName,
                           PurchaseOrderStatus status, LocalDate expectedDate, String notes, String cancelReason,
                           Instant submittedAt, Instant receivedAt, List<PoLineDto> lines) {
        public static PoDetail from(PurchaseOrder p) {
            return new PoDetail(p.getId(), p.getPoNumber(), p.getSupplier().getId(), p.getSupplier().getName(),
                    p.getStatus(), p.getExpectedDate(), p.getNotes(), p.getCancelReason(),
                    p.getSubmittedAt(), p.getReceivedAt(),
                    p.getItems().stream().map(PoLineDto::from).toList());
        }
    }
}
