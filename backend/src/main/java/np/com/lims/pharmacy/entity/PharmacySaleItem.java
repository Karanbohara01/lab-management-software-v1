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
@Table(name = "pharmacy_sale_item")
public class PharmacySaleItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sale_id", nullable = false)
    private PharmacySale sale;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "item_id", nullable = false)
    private PharmacyItem item;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "batch_id", nullable = false)
    private PharmacyBatch batch;

    @Column(name = "unit_type", nullable = false, length = 20)
    private String unitType = "UNIT"; // PACK or UNIT

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "units_deducted", nullable = false)
    private Integer unitsDeducted;

    @Column(name = "unit_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "discount_amount", precision = 12, scale = 2)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "is_vat_applicable", nullable = false)
    private Boolean isVatApplicable = false;

    @Column(name = "vat_percentage", precision = 5, scale = 2)
    private BigDecimal vatPercentage = BigDecimal.ZERO;

    @Column(name = "vat_amount", precision = 12, scale = 2)
    private BigDecimal vatAmount = BigDecimal.ZERO;

    @Column(name = "total_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalPrice;

    @Column(name = "dosage_instruction", length = 160)
    private String dosageInstruction;

    public Long getId() {
        return id;
    }

    public PharmacySale getSale() {
        return sale;
    }

    public void setSale(PharmacySale sale) {
        this.sale = sale;
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

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public Integer getUnitsDeducted() {
        return unitsDeducted;
    }

    public void setUnitsDeducted(Integer unitsDeducted) {
        this.unitsDeducted = unitsDeducted;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(BigDecimal unitPrice) {
        this.unitPrice = unitPrice;
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

    public BigDecimal getTotalPrice() {
        return totalPrice;
    }

    public void setTotalPrice(BigDecimal totalPrice) {
        this.totalPrice = totalPrice;
    }

    public String getDosageInstruction() {
        return dosageInstruction;
    }

    public void setDosageInstruction(String dosageInstruction) {
        this.dosageInstruction = dosageInstruction;
    }
}
