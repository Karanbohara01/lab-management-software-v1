package np.com.lims.pharmacy.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import np.com.lims.common.audit.BaseEntity;
import np.com.lims.common.tenant.TenantContext;
import org.hibernate.annotations.Filter;

import java.math.BigDecimal;

@Entity
@Table(name = "pharmacy_item")
@Filter(name = "tenantFilter", condition = "organization_id = :tenantId")
public class PharmacyItem extends BaseEntity {

    @Column(name = "organization_id", nullable = false, updatable = false)
    private Long organizationId;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(name = "generic_name", length = 250)
    private String genericName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private PharmacyItemCategory category = PharmacyItemCategory.ALLOPATHIC;

    @Enumerated(EnumType.STRING)
    @Column(name = "dosage_form", nullable = false, length = 50)
    private PharmacyDosageForm dosageForm = PharmacyDosageForm.TABLET;

    @Column(length = 80)
    private String strength;

    @Column(length = 150)
    private String manufacturer;

    @Column(name = "pack_unit", nullable = false, length = 30)
    private String packUnit = "STRIP";

    @Column(name = "dispensing_unit", nullable = false, length = 30)
    private String dispensingUnit = "TAB";

    @Column(name = "pack_size", nullable = false)
    private Integer packSize = 10;

    @Column(name = "hs_code", length = 30)
    private String hsCode = "3004.90.00";

    @Column(name = "is_vat_applicable", nullable = false)
    private Boolean isVatApplicable = false;

    @Column(name = "vat_percentage", nullable = false, precision = 5, scale = 2)
    private BigDecimal vatPercentage = BigDecimal.ZERO;

    @Column(length = 30)
    private String schedule = "SCHEDULE_H";

    @Column(name = "rack_location", length = 80)
    private String rackLocation;

    @Column(name = "min_stock_level")
    private Integer minStockLevel = 10;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "is_narcotic", nullable = false)
    private Boolean isNarcotic = false;

    @Column(name = "requires_prescription", nullable = false)
    private Boolean requiresPrescription = false;

    @Column(length = 80)
    private String barcode;

    @PrePersist
    private void assignTenant() {
        if (organizationId == null) {
            Long tenant = TenantContext.get();
            this.organizationId = tenant != null ? tenant : 1L;
        }
    }

    public Long getOrganizationId() {
        return organizationId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getGenericName() {
        return genericName;
    }

    public void setGenericName(String genericName) {
        this.genericName = genericName;
    }

    public PharmacyItemCategory getCategory() {
        return category;
    }

    public void setCategory(PharmacyItemCategory category) {
        this.category = category;
    }

    public PharmacyDosageForm getDosageForm() {
        return dosageForm;
    }

    public void setDosageForm(PharmacyDosageForm dosageForm) {
        this.dosageForm = dosageForm;
    }

    public String getStrength() {
        return strength;
    }

    public void setStrength(String strength) {
        this.strength = strength;
    }

    public String getManufacturer() {
        return manufacturer;
    }

    public void setManufacturer(String manufacturer) {
        this.manufacturer = manufacturer;
    }

    public String getPackUnit() {
        return packUnit;
    }

    public void setPackUnit(String packUnit) {
        this.packUnit = packUnit;
    }

    public String getDispensingUnit() {
        return dispensingUnit;
    }

    public void setDispensingUnit(String dispensingUnit) {
        this.dispensingUnit = dispensingUnit;
    }

    public Integer getPackSize() {
        return packSize == null || packSize < 1 ? 1 : packSize;
    }

    public void setPackSize(Integer packSize) {
        this.packSize = packSize;
    }

    public String getHsCode() {
        return hsCode;
    }

    public void setHsCode(String hsCode) {
        this.hsCode = hsCode;
    }

    public Boolean getIsVatApplicable() {
        return isVatApplicable;
    }

    public void setIsVatApplicable(Boolean isVatApplicable) {
        this.isVatApplicable = isVatApplicable != null ? isVatApplicable : false;
    }

    public BigDecimal getVatPercentage() {
        return vatPercentage;
    }

    public void setVatPercentage(BigDecimal vatPercentage) {
        this.vatPercentage = vatPercentage != null ? vatPercentage : BigDecimal.ZERO;
    }

    public String getSchedule() {
        return schedule;
    }

    public void setSchedule(String schedule) {
        this.schedule = schedule;
    }

    public String getRackLocation() {
        return rackLocation;
    }

    public void setRackLocation(String rackLocation) {
        this.rackLocation = rackLocation;
    }

    public Integer getMinStockLevel() {
        return minStockLevel;
    }

    public void setMinStockLevel(Integer minStockLevel) {
        this.minStockLevel = minStockLevel;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public Boolean getIsNarcotic() {
        return isNarcotic != null ? isNarcotic : false;
    }

    public void setIsNarcotic(Boolean isNarcotic) {
        this.isNarcotic = isNarcotic;
    }

    public Boolean getRequiresPrescription() {
        return requiresPrescription != null ? requiresPrescription : false;
    }

    public void setRequiresPrescription(Boolean requiresPrescription) {
        this.requiresPrescription = requiresPrescription;
    }

    public String getBarcode() {
        return barcode;
    }

    public void setBarcode(String barcode) {
        this.barcode = barcode;
    }
}
