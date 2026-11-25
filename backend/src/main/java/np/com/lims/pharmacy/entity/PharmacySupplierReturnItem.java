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
@Table(name = "pharmacy_supplier_return_item")
public class PharmacySupplierReturnItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "supplier_return_id", nullable = false)
    private PharmacySupplierReturn supplierReturn;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "item_id", nullable = false)
    private PharmacyItem item;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "batch_id", nullable = false)
    private PharmacyBatch batch;

    @Column(name = "batch_number", nullable = false, length = 60)
    private String batchNumber;

    @Column(name = "expiry_date", nullable = false)
    private LocalDate expiryDate;

    @Column(name = "pack_quantity", nullable = false)
    private Integer packQuantity;

    @Column(name = "rate_per_pack", nullable = false, precision = 12, scale = 2)
    private BigDecimal ratePerPack;

    @Column(name = "line_total", nullable = false, precision = 12, scale = 2)
    private BigDecimal lineTotal;

    public Long getId() {
        return id;
    }

    public PharmacySupplierReturn getSupplierReturn() {
        return supplierReturn;
    }

    public void setSupplierReturn(PharmacySupplierReturn supplierReturn) {
        this.supplierReturn = supplierReturn;
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

    public LocalDate getExpiryDate() {
        return expiryDate;
    }

    public void setExpiryDate(LocalDate expiryDate) {
        this.expiryDate = expiryDate;
    }

    public Integer getPackQuantity() {
        return packQuantity;
    }

    public void setPackQuantity(Integer packQuantity) {
        this.packQuantity = packQuantity;
    }

    public BigDecimal getRatePerPack() {
        return ratePerPack;
    }

    public void setRatePerPack(BigDecimal ratePerPack) {
        this.ratePerPack = ratePerPack;
    }

    public BigDecimal getLineTotal() {
        return lineTotal;
    }

    public void setLineTotal(BigDecimal lineTotal) {
        this.lineTotal = lineTotal;
    }
}
