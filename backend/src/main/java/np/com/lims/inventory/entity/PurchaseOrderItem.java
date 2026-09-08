package np.com.lims.inventory.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import np.com.lims.common.audit.BaseEntity;

import java.math.BigDecimal;

@Entity
@Table(name = "purchase_order_item")
public class PurchaseOrderItem extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "purchase_order_id", nullable = false)
    private PurchaseOrder purchaseOrder;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "inventory_item_id", nullable = false)
    private InventoryItem item;

    @Column(name = "item_code", nullable = false, length = 40)
    private String itemCode;

    @Column(name = "item_name", nullable = false, length = 200)
    private String itemName;

    @Column(nullable = false, length = 24)
    private String unit;

    @Column(name = "quantity_ordered", nullable = false, precision = 14, scale = 3)
    private BigDecimal quantityOrdered;

    @Column(name = "quantity_received", nullable = false, precision = 14, scale = 3)
    private BigDecimal quantityReceived = BigDecimal.ZERO;

    @Column(name = "estimated_unit_cost", precision = 12, scale = 2)
    private BigDecimal estimatedUnitCost;

    protected PurchaseOrderItem() {
    }

    PurchaseOrderItem(PurchaseOrder purchaseOrder, InventoryItem item, BigDecimal quantityOrdered,
                      BigDecimal estimatedUnitCost) {
        this.purchaseOrder = purchaseOrder;
        this.item = item;
        this.itemCode = item.getCode();
        this.itemName = item.getName();
        this.unit = item.getUnit();
        this.quantityOrdered = quantityOrdered;
        this.estimatedUnitCost = estimatedUnitCost;
    }

    public void recordReceived(BigDecimal amount) {
        this.quantityReceived = this.quantityReceived.add(amount);
    }

    public boolean isFullyReceived() {
        return quantityReceived.compareTo(quantityOrdered) >= 0;
    }

    public BigDecimal outstanding() {
        return quantityOrdered.subtract(quantityReceived).max(BigDecimal.ZERO);
    }

    public InventoryItem getItem() {
        return item;
    }

    public String getItemCode() {
        return itemCode;
    }

    public String getItemName() {
        return itemName;
    }

    public String getUnit() {
        return unit;
    }

    public BigDecimal getQuantityOrdered() {
        return quantityOrdered;
    }

    public BigDecimal getQuantityReceived() {
        return quantityReceived;
    }

    public BigDecimal getEstimatedUnitCost() {
        return estimatedUnitCost;
    }
}
