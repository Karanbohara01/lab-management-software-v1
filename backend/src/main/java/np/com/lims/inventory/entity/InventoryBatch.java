package np.com.lims.inventory.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import np.com.lims.common.audit.BaseEntity;
import np.com.lims.common.exception.ApiException;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "inventory_batch")
public class InventoryBatch extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "inventory_item_id", nullable = false)
    private InventoryItem item;

    @Column(name = "batch_number", nullable = false, length = 80)
    private String batchNumber;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "supplier_id")
    private Supplier supplier;

    @Column(name = "received_date", nullable = false)
    private LocalDate receivedDate;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Column(name = "initial_quantity", nullable = false, precision = 14, scale = 3)
    private BigDecimal initialQuantity;

    @Column(name = "remaining_quantity", nullable = false, precision = 14, scale = 3)
    private BigDecimal remainingQuantity;

    @Column(name = "unit_cost", precision = 12, scale = 2)
    private BigDecimal unitCost;

    @Column(length = 500)
    private String notes;

    protected InventoryBatch() {
    }

    InventoryBatch(InventoryItem item, String batchNumber, Supplier supplier, LocalDate receivedDate,
                   LocalDate expiryDate, BigDecimal quantity, BigDecimal unitCost, String notes) {
        this.item = item;
        this.batchNumber = batchNumber;
        this.supplier = supplier;
        this.receivedDate = receivedDate == null ? LocalDate.now() : receivedDate;
        this.expiryDate = expiryDate;
        this.initialQuantity = quantity;
        this.remainingQuantity = quantity;
        this.unitCost = unitCost;
        this.notes = notes;
    }

    /** Consumes up to {@code want} from this batch, returning the amount actually taken. */
    BigDecimal consume(BigDecimal want) {
        BigDecimal taken = want.min(remainingQuantity);
        this.remainingQuantity = this.remainingQuantity.subtract(taken);
        return taken;
    }

    void addBack(BigDecimal amount) {
        this.remainingQuantity = this.remainingQuantity.add(amount);
    }

    public void setRemaining(BigDecimal newQuantity) {
        if (newQuantity.signum() < 0) {
            throw ApiException.conflict("Batch quantity cannot be negative");
        }
        this.remainingQuantity = newQuantity;
    }

    public boolean hasStock() {
        return remainingQuantity.signum() > 0;
    }

    public boolean isExpired(LocalDate today) {
        return expiryDate != null && expiryDate.isBefore(today);
    }

    public boolean isExpiringWithin(LocalDate today, int days) {
        return expiryDate != null && !expiryDate.isBefore(today) && !expiryDate.isAfter(today.plusDays(days));
    }

    public InventoryItem getItem() {
        return item;
    }

    public String getBatchNumber() {
        return batchNumber;
    }

    public Supplier getSupplier() {
        return supplier;
    }

    public LocalDate getReceivedDate() {
        return receivedDate;
    }

    public LocalDate getExpiryDate() {
        return expiryDate;
    }

    public BigDecimal getInitialQuantity() {
        return initialQuantity;
    }

    public BigDecimal getRemainingQuantity() {
        return remainingQuantity;
    }

    public BigDecimal getUnitCost() {
        return unitCost;
    }

    public String getNotes() {
        return notes;
    }
}
