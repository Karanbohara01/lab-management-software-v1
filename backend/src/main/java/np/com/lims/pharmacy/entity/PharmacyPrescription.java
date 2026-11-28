package np.com.lims.pharmacy.entity;

import jakarta.persistence.*;
import np.com.lims.common.audit.BaseEntity;
import np.com.lims.common.tenant.TenantContext;
import org.hibernate.annotations.Filter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "pharmacy_prescription")
@Filter(name = "tenantFilter", condition = "organization_id = :tenantId")
public class PharmacyPrescription extends BaseEntity {

    @Column(name = "organization_id", nullable = false, updatable = false)
    private Long organizationId;

    @Column(name = "prescription_number", nullable = false, unique = true, length = 60)
    private String prescriptionNumber;

    @Column(name = "patient_id")
    private Long patientId;

    @Column(name = "patient_name", nullable = false, length = 160)
    private String patientName;

    @Column(name = "patient_mrn", length = 60)
    private String patientMrn;

    @Column(name = "patient_phone", length = 40)
    private String patientPhone;

    @Column(name = "doctor_id")
    private Long doctorId;

    @Column(name = "doctor_name", nullable = false, length = 160)
    private String doctorName;

    @Column(name = "doctor_nmc", length = 50)
    private String doctorNmc;

    @Column(length = 100)
    private String department = "OPD";

    @Column(length = 255)
    private String diagnosis;

    @Column(nullable = false, length = 40)
    private String status = "PENDING"; // PENDING, PARTIALLY_DISPENSED, COMPLETED, CANCELLED

    @Column(name = "valid_until")
    private LocalDate validUntil;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @OneToMany(mappedBy = "prescription", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PharmacyPrescriptionItem> items = new ArrayList<>();

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

    public String getPrescriptionNumber() {
        return prescriptionNumber;
    }

    public void setPrescriptionNumber(String prescriptionNumber) {
        this.prescriptionNumber = prescriptionNumber;
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

    public String getPatientMrn() {
        return patientMrn;
    }

    public void setPatientMrn(String patientMrn) {
        this.patientMrn = patientMrn;
    }

    public String getPatientPhone() {
        return patientPhone;
    }

    public void setPatientPhone(String patientPhone) {
        this.patientPhone = patientPhone;
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

    public String getDoctorNmc() {
        return doctorNmc;
    }

    public void setDoctorNmc(String doctorNmc) {
        this.doctorNmc = doctorNmc;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getDiagnosis() {
        return diagnosis;
    }

    public void setDiagnosis(String diagnosis) {
        this.diagnosis = diagnosis;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDate getValidUntil() {
        return validUntil;
    }

    public void setValidUntil(LocalDate validUntil) {
        this.validUntil = validUntil;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public List<PharmacyPrescriptionItem> getItems() {
        return items;
    }

    public void setItems(List<PharmacyPrescriptionItem> items) {
        this.items = items;
    }

    public void addItem(PharmacyPrescriptionItem item) {
        items.add(item);
        item.setPrescription(this);
    }
}
