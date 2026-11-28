package np.com.lims.pharmacy.entity;

import jakarta.persistence.*;
import np.com.lims.common.audit.BaseEntity;
import org.hibernate.annotations.Filter;

@Entity
@Table(name = "pharmacy_patient_allergy")
@Filter(name = "tenantFilter", condition = "organization_id = :tenantId")
public class PharmacyPatientAllergy extends BaseEntity {

    @Column(name = "organization_id", nullable = false, updatable = false)
    private Long organizationId;

    @Column(name = "patient_id", nullable = false)
    private Long patientId;

    @Column(name = "allergen_generic", nullable = false, length = 150)
    private String allergenGeneric;

    @Column(name = "severity", nullable = false, length = 40)
    private String severity; // 'MILD', 'MODERATE', 'SEVERE', 'ANAPHYLACTIC'

    @Column(name = "reaction_details", length = 255)
    private String reactionDetails;

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

    public String getAllergenGeneric() {
        return allergenGeneric;
    }

    public void setAllergenGeneric(String allergenGeneric) {
        this.allergenGeneric = allergenGeneric != null ? allergenGeneric.trim().toUpperCase() : null;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public String getReactionDetails() {
        return reactionDetails;
    }

    public void setReactionDetails(String reactionDetails) {
        this.reactionDetails = reactionDetails;
    }
}
