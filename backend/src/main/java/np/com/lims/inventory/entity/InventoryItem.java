package np.com.lims.inventory.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import np.com.lims.common.audit.BaseEntity;
import np.com.lims.common.exception.ApiException;
import np.com.lims.department.entity.Department;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Entity
@Table(name = "inventory_item")
public class InventoryItem extends BaseEntity {

    private static final Comparator<InventoryBatch> FEFO = Comparator
            .comparing(InventoryBatch::getExpiryDate, Comparator.nullsLast(Comparator.naturalOrder()))
            .thenComparing(b -> b.getId() == null ? Long.MAX_VALUE : b.getId());

    @Column(nullable = false, length = 40, unique = true)
    private String code;

    @Column(nullable = false, length = 200)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ItemCategory category = ItemCategory.OTHER;

    @Column(nullable = false, length = 24)
    private String unit;

    @Column(name = "minimum_stock", nullable = false, precision = 14, scale = 3)
    private BigDecimal minimumStock = BigDecimal.ZERO;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "department_id")
    private Department department;

    @Column(length = 1000)
    private String notes;

    @Column(nullable = false)
    private boolean active = true;

    @OneToMany(mappedBy = "item", cascade = CascadeType.ALL, orphanRemoval = true)
    @org.hibernate.annotations.BatchSize(size = 50)
    private List<InventoryBatch> batches = new ArrayList<>();

    protected InventoryItem() {
    }

    public static InventoryItem create(String code, String name, ItemCategory category, String unit) {
        InventoryItem i = new InventoryItem();
        i.code = code;
        i.name = name;
        i.category = category;
        i.unit = unit;
        i.active = true;
        return i;
    }

    public void update(String name, ItemCategory category, String unit, BigDecimal minimumStock,
                       Department department, String notes) {
        this.name = name;
        this.category = category;
        this.unit = unit;
        this.minimumStock = minimumStock == null ? BigDecimal.ZERO : minimumStock.max(BigDecimal.ZERO);
        this.department = department;
        this.notes = notes;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public InventoryBatch receive(String batchNumber, Supplier supplier, LocalDate receivedDate, LocalDate expiryDate,
                                  BigDecimal quantity, BigDecimal unitCost, String notes) {
        if (quantity == null || quantity.signum() <= 0) {
            throw ApiException.conflict("Received quantity must be greater than zero");
        }
        InventoryBatch batch = new InventoryBatch(this, batchNumber, supplier, receivedDate, expiryDate,
                quantity, unitCost, notes);
        batches.add(batch);
        return batch;
    }

    /** First-expiry-first-out consumption. Returns each batch touched and the amount taken from it. */
    public List<BatchDraw> issueFefo(BigDecimal quantity) {
        if (quantity == null || quantity.signum() <= 0) {
            throw ApiException.conflict("Issued quantity must be greater than zero");
        }
        if (quantityOnHand().compareTo(quantity) < 0) {
            throw ApiException.conflict("Insufficient stock: " + quantityOnHand() + " " + unit + " on hand");
        }
        List<BatchDraw> draws = new ArrayList<>();
        BigDecimal remaining = quantity;
        for (InventoryBatch batch : batches.stream().filter(InventoryBatch::hasStock).sorted(FEFO).toList()) {
            if (remaining.signum() <= 0) {
                break;
            }
            BigDecimal taken = batch.consume(remaining);
            remaining = remaining.subtract(taken);
            draws.add(new BatchDraw(batch, taken));
        }
        return draws;
    }

    public BigDecimal quantityOnHand() {
        return batches.stream().map(InventoryBatch::getRemainingQuantity)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public boolean hasExpiredStock(LocalDate today) {
        return batches.stream().anyMatch(b -> b.hasStock() && b.isExpired(today));
    }

    public boolean hasExpiringStock(LocalDate today, int days) {
        return batches.stream().anyMatch(b -> b.hasStock() && b.isExpiringWithin(today, days));
    }

    public StockStatus status(LocalDate today, int expiryAlertDays) {
        if (hasExpiredStock(today)) {
            return StockStatus.EXPIRED;
        }
        BigDecimal onHand = quantityOnHand();
        if (onHand.signum() == 0) {
            return StockStatus.OUT_OF_STOCK;
        }
        if (onHand.compareTo(minimumStock) <= 0) {
            return StockStatus.LOW_STOCK;
        }
        if (hasExpiringStock(today, expiryAlertDays)) {
            return StockStatus.EXPIRING_SOON;
        }
        return StockStatus.IN_STOCK;
    }

    public record BatchDraw(InventoryBatch batch, BigDecimal taken) {
    }

    public String getCode() {
        return code;
    }

    public String getName() {
        return name;
    }

    public ItemCategory getCategory() {
        return category;
    }

    public String getUnit() {
        return unit;
    }

    public BigDecimal getMinimumStock() {
        return minimumStock;
    }

    public Department getDepartment() {
        return department;
    }

    public String getNotes() {
        return notes;
    }

    public boolean isActive() {
        return active;
    }

    public List<InventoryBatch> getBatches() {
        return batches;
    }
}
