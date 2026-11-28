package np.com.lims.pharmacy.entity;

import jakarta.persistence.*;
import np.com.lims.common.audit.BaseEntity;
import org.hibernate.annotations.Filter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "pharmacy_refill_schedule")
@Filter(name = "tenantFilter", condition = "organization_id = :tenantId")
public class PharmacyRefillSchedule extends BaseEntity {

    @Column(name = "organization_id", nullable = false, updatable = false)
    private Long organizationId;

    @Column(name = "patient_id")
    private Long patientId;

    @Column(name = "patient_name", nullable = false, length = 150)
    private String patientName;

    @Column(name = "patient_phone", nullable = false, length = 40)
    private String patientPhone;

    @Column(name = "sale_id")
    private Long saleId;

    @Column(name = "invoice_number", length = 60)
    private String invoiceNumber;

    @Column(name = "item_id", nullable = false)
    private Long itemId;

    @Column(name = "item_name", nullable = false, length = 200)
    private String itemName;

    @Column(name = "dispensed_quantity", nullable = false)
    private Integer dispensedQuantity;

    @Column(name = "unit_type", nullable = false, length = 40)
    private String unitType = "UNIT";

    @Column(name = "dosage_instruction", length = 150)
    private String dosageInstruction;

    @Column(name = "dispensed_date", nullable = false)
    private LocalDate dispensedDate;

    @Column(name = "course_days", nullable = false)
    private Integer courseDays = 30;

    @Column(name = "refill_due_date", nullable = false)
    private LocalDate refillDueDate;

    @Column(name = "status", nullable = false, length = 40)
    private String status = "SCHEDULED"; // 'SCHEDULED', 'REMINDER_SENT', 'REFILLED', 'LAPSED'

    @Column(name = "last_reminder_sent_at")
    private LocalDateTime lastReminderSentAt;

    @Column(name = "reminder_count", nullable = false)
    private Integer reminderCount = 0;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    public Long getOrganizationId() {
        return organizationId;
    }

    public void setOrganizationId(Long organizationId) {
        this.organizationId = organizationId;
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

    public String getPatientPhone() {
        return patientPhone;
    }

    public void setPatientPhone(String patientPhone) {
        this.patientPhone = patientPhone;
    }

    public Long getSaleId() {
        return saleId;
    }

    public void setSaleId(Long saleId) {
        this.saleId = saleId;
    }

    public String getInvoiceNumber() {
        return invoiceNumber;
    }

    public void setInvoiceNumber(String invoiceNumber) {
        this.invoiceNumber = invoiceNumber;
    }

    public Long getItemId() {
        return itemId;
    }

    public void setItemId(Long itemId) {
        this.itemId = itemId;
    }

    public String getItemName() {
        return itemName;
    }

    public void setItemName(String itemName) {
        this.itemName = itemName;
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

    public String getDosageInstruction() {
        return dosageInstruction;
    }

    public void setDosageInstruction(String dosageInstruction) {
        this.dosageInstruction = dosageInstruction;
    }

    public LocalDate getDispensedDate() {
        return dispensedDate;
    }

    public void setDispensedDate(LocalDate dispensedDate) {
        this.dispensedDate = dispensedDate;
    }

    public Integer getCourseDays() {
        return courseDays;
    }

    public void setCourseDays(Integer courseDays) {
        this.courseDays = courseDays;
    }

    public LocalDate getRefillDueDate() {
        return refillDueDate;
    }

    public void setRefillDueDate(LocalDate refillDueDate) {
        this.refillDueDate = refillDueDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getLastReminderSentAt() {
        return lastReminderSentAt;
    }

    public void setLastReminderSentAt(LocalDateTime lastReminderSentAt) {
        this.lastReminderSentAt = lastReminderSentAt;
    }

    public Integer getReminderCount() {
        return reminderCount;
    }

    public void setReminderCount(Integer reminderCount) {
        this.reminderCount = reminderCount;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
