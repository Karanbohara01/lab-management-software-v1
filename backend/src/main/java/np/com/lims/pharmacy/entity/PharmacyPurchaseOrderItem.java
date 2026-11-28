package np.com.lims.pharmacy.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.math.BigDecimal;

@Entity
@Table(name = "pharmacy_purchase_order_item")
public class PharmacyPurchaseOrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "purchase_order_id", nullable = false)
    private PharmacyPurchaseOrder purchaseOrder;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "item_id", nullable = false)
    private PharmacyItem item;

    @Column(name = "pack_unit", nullable = false, length = 30)
    private String packUnit = "STRIP";

    @Column(name = "pack_size", nullable = false)
    private Integer packSize = 10;

    @Column(name = "recommended_pack_qty", nullable = false)
    private Integer recommendedPackQty = 1;

    @Column(name = "ordered_pack_qty", nullable = false)
    private Integer orderedPackQty = 1;

    @Column(name = "received_pack_qty", nullable = false)
    private Integer receivedPackQty = 0;

    @Column(name = "estimated_rate_per_pack", nullable = false, precision = 12, scale = 2)
    private BigDecimal estimatedRatePerPack = BigDecimal.ZERO;

    @Column(name = "estimated_total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal estimatedTotalAmount = BigDecimal.ZERO;

    @Column(length = 255)
    private String remarks;

    public Long getId() {
        return id;
    }

    public PharmacyPurchaseOrder getPurchaseOrder() {
        return purchaseOrder;
    }

    public void setPurchaseOrder(PharmacyPurchaseOrder purchaseOrder) {
        this.purchaseOrder = purchaseOrder;
    }

    public PharmacyItem getItem() {
        return item;
    }

    public void setItem(PharmacyItem item) {
        this.item = item;
    }

    public String getPackUnit() {
        return packUnit;
    }

    public void setPackUnit(String packUnit) {
        this.packUnit = packUnit;
    }

    public Integer getPackSize() {
        return packSize;
    }

    public void setPackSize(Integer packSize) {
        this.packSize = packSize;
    }

    public Integer getRecommendedPackQty() {
        return recommendedPackQty;
    }

    public void setRecommendedPackQty(Integer recommendedPackQty) {
        this.recommendedPackQty = recommendedPackQty;
    }

    public Integer getOrderedPackQty() {
        return orderedPackQty;
    }

    public void setOrderedPackQty(Integer orderedPackQty) {
        this.orderedPackQty = orderedPackQty;
    }

    public Integer getReceivedPackQty() {
        return receivedPackQty;
    }

    public void setReceivedPackQty(Integer receivedPackQty) {
        this.receivedPackQty = receivedPackQty;
    }

    public BigDecimal getEstimatedRatePerPack() {
        return estimatedRatePerPack;
    }

    public void setEstimatedRatePerPack(BigDecimal estimatedRatePerPack) {
        this.estimatedRatePerPack = estimatedRatePerPack;
    }

    public BigDecimal getEstimatedTotalAmount() {
        return estimatedTotalAmount;
    }

    public void setEstimatedTotalAmount(BigDecimal estimatedTotalAmount) {
        this.estimatedTotalAmount = estimatedTotalAmount;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }
}
