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
import java.time.LocalDate;

@Entity
@Table(name = "pharmacy_purchase_item")
public class PharmacyPurchaseItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "purchase_id", nullable = false)
    private PharmacyPurchase purchase;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "item_id", nullable = false)
    private PharmacyItem item;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_id")
    private PharmacyBatch batch;

    @Column(name = "batch_number", nullable = false, length = 80)
    private String batchNumber;

    @Column(name = "mfg_date")
    private LocalDate mfgDate;

    @Column(name = "expiry_date", nullable = false)
    private LocalDate expiryDate;

    @Column(name = "pack_size", nullable = false)
    private Integer packSize = 10;

    @Column(name = "billed_pack_qty", nullable = false)
    private Integer billedPackQty;

    @Column(name = "free_pack_qty", nullable = false)
    private Integer freePackQty = 0;

    @Column(name = "purchase_rate_per_pack", nullable = false, precision = 12, scale = 2)
    private BigDecimal purchaseRatePerPack;

    @Column(name = "discount_percentage", precision = 5, scale = 2)
    private BigDecimal discountPercentage = BigDecimal.ZERO;

    @Column(name = "discount_amount", precision = 12, scale = 2)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "is_vat_applicable", nullable = false)
    private Boolean isVatApplicable = false;

    @Column(name = "vat_percentage", precision = 5, scale = 2)
    private BigDecimal vatPercentage = BigDecimal.ZERO;

    @Column(name = "vat_amount", precision = 12, scale = 2)
    private BigDecimal vatAmount = BigDecimal.ZERO;

    @Column(name = "mrp_per_pack", nullable = false, precision = 12, scale = 2)
    private BigDecimal mrpPerPack;

    @Column(name = "wholesale_rate_per_pack", precision = 12, scale = 2)
    private BigDecimal wholesaleRatePerPack;

    @Column(name = "line_total", nullable = false, precision = 12, scale = 2)
    private BigDecimal lineTotal;

    @Column(name = "effective_unit_cost", nullable = false, precision = 12, scale = 4)
    private BigDecimal effectiveUnitCost;

    public Long getId() {
        return id;
    }

    public PharmacyPurchase getPurchase() {
        return purchase;
    }

    public void setPurchase(PharmacyPurchase purchase) {
        this.purchase = purchase;
    }

    public PharmacyItem getItem() {
        return item;
    }

    public void setItem(PharmacyItem item) {
        this.item = item;
    }

    public PharmacyBatch getBatch() {
        return batch;
    }

    public void setBatch(PharmacyBatch batch) {
        this.batch = batch;
    }

    public String getBatchNumber() {
        return batchNumber;
    }

    public void setBatchNumber(String batchNumber) {
        this.batchNumber = batchNumber;
    }

    public LocalDate getMfgDate() {
        return mfgDate;
    }

    public void setMfgDate(LocalDate mfgDate) {
        this.mfgDate = mfgDate;
    }

    public LocalDate getExpiryDate() {
        return expiryDate;
    }

    public void setExpiryDate(LocalDate expiryDate) {
        this.expiryDate = expiryDate;
    }

    public Integer getPackSize() {
        return packSize;
    }

    public void setPackSize(Integer packSize) {
        this.packSize = packSize;
    }

    public Integer getBilledPackQty() {
        return billedPackQty;
    }

    public void setBilledPackQty(Integer billedPackQty) {
        this.billedPackQty = billedPackQty;
    }

    public Integer getFreePackQty() {
        return freePackQty;
    }

    public void setFreePackQty(Integer freePackQty) {
        this.freePackQty = freePackQty;
    }

    public BigDecimal getPurchaseRatePerPack() {
        return purchaseRatePerPack;
    }

    public void setPurchaseRatePerPack(BigDecimal purchaseRatePerPack) {
        this.purchaseRatePerPack = purchaseRatePerPack;
    }

    public BigDecimal getDiscountPercentage() {
        return discountPercentage;
    }

    public void setDiscountPercentage(BigDecimal discountPercentage) {
        this.discountPercentage = discountPercentage;
    }

    public BigDecimal getDiscountAmount() {
        return discountAmount;
    }

    public void setDiscountAmount(BigDecimal discountAmount) {
        this.discountAmount = discountAmount;
    }

    public Boolean getIsVatApplicable() {
        return isVatApplicable;
    }

    public void setIsVatApplicable(Boolean isVatApplicable) {
        this.isVatApplicable = isVatApplicable;
    }

    public BigDecimal getVatPercentage() {
        return vatPercentage;
    }

    public void setVatPercentage(BigDecimal vatPercentage) {
        this.vatPercentage = vatPercentage;
    }

    public BigDecimal getVatAmount() {
        return vatAmount;
    }

    public void setVatAmount(BigDecimal vatAmount) {
        this.vatAmount = vatAmount;
    }

    public BigDecimal getMrpPerPack() {
        return mrpPerPack;
    }

    public void setMrpPerPack(BigDecimal mrpPerPack) {
        this.mrpPerPack = mrpPerPack;
    }

    public BigDecimal getWholesaleRatePerPack() {
        return wholesaleRatePerPack;
    }

    public void setWholesaleRatePerPack(BigDecimal wholesaleRatePerPack) {
        this.wholesaleRatePerPack = wholesaleRatePerPack;
    }

    public BigDecimal getLineTotal() {
        return lineTotal;
    }

    public void setLineTotal(BigDecimal lineTotal) {
        this.lineTotal = lineTotal;
    }

    public BigDecimal getEffectiveUnitCost() {
        return effectiveUnitCost;
    }

    public void setEffectiveUnitCost(BigDecimal effectiveUnitCost) {
        this.effectiveUnitCost = effectiveUnitCost;
    }
}
