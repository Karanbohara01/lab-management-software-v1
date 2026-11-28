package np.com.lims.pharmacy.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import np.com.lims.common.audit.BaseEntity;
import np.com.lims.common.tenant.TenantContext;
import org.hibernate.annotations.Filter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "pharmacy_narcotic_log")
@Filter(name = "tenantFilter", condition = "organization_id = :tenantId")
public class PharmacyNarcoticLog extends BaseEntity {

    @Column(name = "organization_id", nullable = false, updatable = false)
    private Long organizationId;

    @Column(name = "item_id", nullable = false)
    private Long itemId;

    @Column(name = "batch_id", nullable = false)
    private Long batchId;

    @Column(name = "sale_id")
    private Long saleId;

    @Column(name = "sale_item_id")
    private Long saleItemId;

    @Column(name = "log_date", nullable = false)
    private LocalDateTime logDate = LocalDateTime.now();

    @Column(name = "patient_id")
    private Long patientId;

    @Column(name = "patient_name", nullable = false, length = 150)
    private String patientName;

    @Column(name = "patient_age_gender", length = 50)
    private String patientAgeGender;

    @Column(name = "patient_address", length = 255)
    private String patientAddress;

    @Column(name = "buyer_name", nullable = false, length = 150)
    private String buyerName;

    @Column(name = "buyer_relation", length = 100)
    private String buyerRelation;

    @Column(name = "buyer_contact", length = 50)
    private String buyerContact;

    @Column(name = "buyer_id_type", length = 50)
    private String buyerIdType = "CITIZENSHIP";

    @Column(name = "buyer_id_number", length = 100)
    private String buyerIdNumber;

    @Column(name = "doctor_id")
    private Long doctorId;

    @Column(name = "doctor_name", nullable = false, length = 150)
    private String doctorName;

    @Column(name = "doctor_nmc_number", nullable = false, length = 50)
    private String doctorNmcNumber;

    @Column(name = "prescription_number", length = 100)
    private String prescriptionNumber;

    @Column(name = "prescription_date")
    private LocalDate prescriptionDate;

    @Column(name = "dispensed_quantity", nullable = false)
    private Integer dispensedQuantity;

    @Column(name = "unit_type", nullable = false, length = 50)
    private String unitType = "UNIT";

    @Column(name = "balance_stock_units", nullable = false)
    private Integer balanceStockUnits;

    @Column(name = "pharmacist_name", nullable = false, length = 150)
    private String pharmacistName;

    @Column(name = "pharmacist_npc_number", length = 50)
    private String pharmacistNpcNumber;

    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;

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

    public void setOrganizationId(Long organizationId) {
        this.organizationId = organizationId;
    }

    public Long getItemId() {
        return itemId;
    }

    public void setItemId(Long itemId) {
        this.itemId = itemId;
    }

    public Long getBatchId() {
        return batchId;
    }

    public void setBatchId(Long batchId) {
        this.batchId = batchId;
    }

    public Long getSaleId() {
        return saleId;
    }

    public void setSaleId(Long saleId) {
        this.saleId = saleId;
    }

    public Long getSaleItemId() {
        return saleItemId;
    }

    public void setSaleItemId(Long saleItemId) {
        this.saleItemId = saleItemId;
    }

    public LocalDateTime getLogDate() {
        return logDate;
    }

    public void setLogDate(LocalDateTime logDate) {
        this.logDate = logDate;
    }

    public Long getPatientId() {
        return patientId;
    }

    public void setPatientId(Long patientId) {
        this.patientId = patientId;
    }

    public String getPatientName() {
        return patientName;
    }

    public void setPatientName(String patientName) {
        this.patientName = patientName;
    }

    public String getPatientAgeGender() {
        return patientAgeGender;
    }

    public void setPatientAgeGender(String patientAgeGender) {
        this.patientAgeGender = patientAgeGender;
    }

    public String getPatientAddress() {
        return patientAddress;
    }

    public void setPatientAddress(String patientAddress) {
        this.patientAddress = patientAddress;
    }

    public String getBuyerName() {
        return buyerName;
    }

    public void setBuyerName(String buyerName) {
        this.buyerName = buyerName;
    }

    public String getBuyerRelation() {
        return buyerRelation;
    }

    public void setBuyerRelation(String buyerRelation) {
        this.buyerRelation = buyerRelation;
    }

    public String getBuyerContact() {
        return buyerContact;
    }

    public void setBuyerContact(String buyerContact) {
        this.buyerContact = buyerContact;
    }

    public String getBuyerIdType() {
        return buyerIdType;
    }

    public void setBuyerIdType(String buyerIdType) {
        this.buyerIdType = buyerIdType;
    }

    public String getBuyerIdNumber() {
        return buyerIdNumber;
    }

    public void setBuyerIdNumber(String buyerIdNumber) {
        this.buyerIdNumber = buyerIdNumber;
    }

    public Long getDoctorId() {
        return doctorId;
    }

    public void setDoctorId(Long doctorId) {
        this.doctorId = doctorId;
    }

    public String getDoctorName() {
        return doctorName;
    }

    public void setDoctorName(String doctorName) {
        this.doctorName = doctorName;
    }

    public String getDoctorNmcNumber() {
        return doctorNmcNumber;
    }

    public void setDoctorNmcNumber(String doctorNmcNumber) {
        this.doctorNmcNumber = doctorNmcNumber;
    }

    public String getPrescriptionNumber() {
        return prescriptionNumber;
    }

    public void setPrescriptionNumber(String prescriptionNumber) {
        this.prescriptionNumber = prescriptionNumber;
    }

    public LocalDate getPrescriptionDate() {
        return prescriptionDate;
    }

    public void setPrescriptionDate(LocalDate prescriptionDate) {
        this.prescriptionDate = prescriptionDate;
    }

    public Integer getDispensedQuantity() {
        return dispensedQuantity;
    }

    public void setDispensedQuantity(Integer dispensedQuantity) {
        this.dispensedQuantity = dispensedQuantity;
    }

    public String getUnitType() {
        return unitType;
    }

    public void setUnitType(String unitType) {
        this.unitType = unitType;
    }

    public Integer getBalanceStockUnits() {
        return balanceStockUnits;
    }

    public void setBalanceStockUnits(Integer balanceStockUnits) {
        this.balanceStockUnits = balanceStockUnits;
    }

    public String getPharmacistName() {
        return pharmacistName;
    }

    public void setPharmacistName(String pharmacistName) {
        this.pharmacistName = pharmacistName;
    }

    public String getPharmacistNpcNumber() {
        return pharmacistNpcNumber;
    }

    public void setPharmacistNpcNumber(String pharmacistNpcNumber) {
        this.pharmacistNpcNumber = pharmacistNpcNumber;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }
}
