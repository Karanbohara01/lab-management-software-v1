package np.com.lims.pharmacy.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import np.com.lims.common.audit.BaseEntity;
import np.com.lims.common.exception.ApiException;
import np.com.lims.common.tenant.TenantContext;
import org.hibernate.annotations.Filter;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.Comparator;

@Entity
@Table(name = "pharmacy_batch")
@Filter(name = "tenantFilter", condition = "organization_id = :tenantId")
public class PharmacyBatch extends BaseEntity {

    public static final Comparator<PharmacyBatch> FEFO = Comparator
            .comparing(PharmacyBatch::getExpiryDate, Comparator.nullsLast(Comparator.naturalOrder()))
            .thenComparing(b -> b.getId() == null ? Long.MAX_VALUE : b.getId());

    @Column(name = "organization_id", nullable = false, updatable = false)
    private Long organizationId;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "item_id", nullable = false)
    private PharmacyItem item;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "wholesaler_id")
    private PharmacyWholesaler wholesaler;

    @Column(name = "batch_number", nullable = false, length = 80)
    private String batchNumber;

    @Column(name = "mfg_date")
    private LocalDate mfgDate;

    @Column(name = "expiry_date", nullable = false)
    private LocalDate expiryDate;

    @Column(name = "pack_size", nullable = false)
    private Integer packSize = 10;

    @Column(name = "initial_units", nullable = false)
    private Integer initialUnits;

    @Column(name = "remaining_units", nullable = false)
    private Integer remainingUnits;

    @Column(name = "purchase_rate_per_pack", nullable = false, precision = 12, scale = 2)
    private BigDecimal purchaseRatePerPack = BigDecimal.ZERO;

    @Column(name = "effective_cost_per_unit", nullable = false, precision = 12, scale = 4)
    private BigDecimal effectiveCostPerUnit = BigDecimal.ZERO;

    @Column(name = "mrp_per_pack", nullable = false, precision = 12, scale = 2)
    private BigDecimal mrpPerPack = BigDecimal.ZERO;

    @Column(name = "unit_mrp", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitMrp = BigDecimal.ZERO;

    @Column(name = "wholesale_rate_per_pack", precision = 12, scale = 2)
    private BigDecimal wholesaleRatePerPack;

    @Column(name = "rack_location", length = 80)
    private String rackLocation;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @PrePersist
    private void assignTenant() {
        if (organizationId == null) {
            Long tenant = TenantContext.get();
            this.organizationId = tenant != null ? tenant : 1L;
        }
        if (packSize == null || packSize < 1) {
            packSize = item != null ? item.getPackSize() : 1;
        }
        if (unitMrp == null || unitMrp.compareTo(BigDecimal.ZERO) == 0) {
            if (mrpPerPack != null && packSize > 0) {
                unitMrp = mrpPerPack.divide(BigDecimal.valueOf(packSize), 2, RoundingMode.HALF_UP);
            }
        }
    }

    public boolean hasStock() {
        return remainingUnits != null && remainingUnits > 0;
    }

    public boolean isExpired(LocalDate today) {
        return expiryDate != null && expiryDate.isBefore(today);
    }

    public boolean isExpiringWithin(LocalDate today, int days) {
        return expiryDate != null && !expiryDate.isBefore(today) && !expiryDate.isAfter(today.plusDays(days));
    }

    public void deductUnits(int units) {
        if (units <= 0) return;
        if (remainingUnits < units) {
            throw ApiException.conflict("Insufficient stock in batch " + batchNumber + ". Available: " + remainingUnits + ", requested: " + units);
        }
        this.remainingUnits -= units;
    }

    public void restockUnits(int units) {
        if (units <= 0) return;
        this.remainingUnits += units;
    }

    public Long getOrganizationId() {
        return organizationId;
    }

    public PharmacyItem getItem() {
        return item;
    }

    public void setItem(PharmacyItem item) {
        this.item = item;
    }

    public PharmacyWholesaler getWholesaler() {
        return wholesaler;
    }

    public void setWholesaler(PharmacyWholesaler wholesaler) {
        this.wholesaler = wholesaler;
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
        return packSize == null || packSize < 1 ? 1 : packSize;
    }

    public void setPackSize(Integer packSize) {
        this.packSize = packSize;
    }

    public Integer getInitialUnits() {
        return initialUnits;
    }

    public void setInitialUnits(Integer initialUnits) {
        this.initialUnits = initialUnits;
    }

    public Integer getRemainingUnits() {
        return remainingUnits;
    }

    public void setRemainingUnits(Integer remainingUnits) {
        this.remainingUnits = remainingUnits;
    }

    public BigDecimal getPurchaseRatePerPack() {
        return purchaseRatePerPack;
    }

    public void setPurchaseRatePerPack(BigDecimal purchaseRatePerPack) {
        this.purchaseRatePerPack = purchaseRatePerPack;
    }

    public BigDecimal getEffectiveCostPerUnit() {
        return effectiveCostPerUnit;
    }

    public void setEffectiveCostPerUnit(BigDecimal effectiveCostPerUnit) {
        this.effectiveCostPerUnit = effectiveCostPerUnit;
    }

    public BigDecimal getMrpPerPack() {
        return mrpPerPack;
    }

    public void setMrpPerPack(BigDecimal mrpPerPack) {
        this.mrpPerPack = mrpPerPack;
        if (packSize != null && packSize > 0) {
            this.unitMrp = mrpPerPack.divide(BigDecimal.valueOf(packSize), 2, RoundingMode.HALF_UP);
        }
    }

    public BigDecimal getUnitMrp() {
        return unitMrp;
    }

    public void setUnitMrp(BigDecimal unitMrp) {
        this.unitMrp = unitMrp;
    }

    public BigDecimal getWholesaleRatePerPack() {
        return wholesaleRatePerPack;
    }

    public void setWholesaleRatePerPack(BigDecimal wholesaleRatePerPack) {
        this.wholesaleRatePerPack = wholesaleRatePerPack;
    }

    public String getRackLocation() {
        return rackLocation;
    }

    public void setRackLocation(String rackLocation) {
        this.rackLocation = rackLocation;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
}
