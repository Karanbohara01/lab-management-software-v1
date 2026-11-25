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
@Table(name = "pharmacy_sale_return_item")
public class PharmacySaleReturnItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sale_return_id", nullable = false)
    private PharmacySaleReturn saleReturn;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sale_item_id", nullable = false)
    private PharmacySaleItem saleItem;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "item_id", nullable = false)
    private PharmacyItem item;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "batch_id", nullable = false)
    private PharmacyBatch batch;

    @Column(name = "unit_type", nullable = false, length = 20)
    private String unitType = "UNIT";

    @Column(name = "return_quantity", nullable = false)
    private Integer returnQuantity;

    @Column(name = "units_restored", nullable = false)
    private Integer unitsRestored;

    @Column(name = "unit_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "is_vat_applicable", nullable = false)
    private Boolean isVatApplicable = false;

    @Column(name = "vat_percentage", precision = 5, scale = 2)
    private BigDecimal vatPercentage = BigDecimal.ZERO;

    @Column(name = "vat_amount", precision = 12, scale = 2)
    private BigDecimal vatAmount = BigDecimal.ZERO;

    @Column(name = "total_refund", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalRefund;

    public Long getId() {
        return id;
    }

    public PharmacySaleReturn getSaleReturn() {
        return saleReturn;
    }

    public void setSaleReturn(PharmacySaleReturn saleReturn) {
        this.saleReturn = saleReturn;
    }

    public PharmacySaleItem getSaleItem() {
        return saleItem;
    }

    public void setSaleItem(PharmacySaleItem saleItem) {
        this.saleItem = saleItem;
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

    public String getUnitType() {
        return unitType;
    }

    public void setUnitType(String unitType) {
        this.unitType = unitType;
    }

    public Integer getReturnQuantity() {
        return returnQuantity;
    }

    public void setReturnQuantity(Integer returnQuantity) {
        this.returnQuantity = returnQuantity;
    }

    public Integer getUnitsRestored() {
        return unitsRestored;
    }

    public void setUnitsRestored(Integer unitsRestored) {
        this.unitsRestored = unitsRestored;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(BigDecimal unitPrice) {
        this.unitPrice = unitPrice;
    }

    public Boolean getIsVatApplicable() {
        return isVatApplicable;
    }

    public void setIsVatApplicable(Boolean vatApplicable) {
        isVatApplicable = vatApplicable;
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

    public BigDecimal getTotalRefund() {
        return totalRefund;
    }

    public void setTotalRefund(BigDecimal totalRefund) {
        this.totalRefund = totalRefund;
    }
}
