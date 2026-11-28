package np.com.lims.pharmacy.entity;

import jakarta.persistence.*;
import np.com.lims.common.audit.BaseEntity;
import org.hibernate.annotations.Filter;

@Entity
@Table(name = "pharmacy_drug_interaction")
@Filter(name = "tenantFilter", condition = "organization_id = :tenantId")
public class PharmacyDrugInteraction extends BaseEntity {

    @Column(name = "organization_id", nullable = false, updatable = false)
    private Long organizationId;

    @Column(name = "drug_a_generic", nullable = false, length = 150)
    private String drugAGeneric;

    @Column(name = "drug_b_generic", nullable = false, length = 150)
    private String drugBGeneric;

    @Column(name = "severity", nullable = false, length = 40)
    private String severity; // 'SEVERE_CONTRAINDICATED', 'MODERATE_MONITOR', 'MINOR_INFORMATIONAL'

    @Column(name = "interaction_title", nullable = false, length = 255)
    private String interactionTitle;

    @Column(name = "clinical_effect", nullable = false, columnDefinition = "TEXT")
    private String clinicalEffect;

    @Column(name = "recommendation", nullable = false, columnDefinition = "TEXT")
    private String recommendation;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    public Long getOrganizationId() {
        return organizationId;
    }

    public void setOrganizationId(Long organizationId) {
        this.organizationId = organizationId;
    }

    public String getDrugAGeneric() {
        return drugAGeneric;
    }

    public void setDrugAGeneric(String drugAGeneric) {
        this.drugAGeneric = drugAGeneric != null ? drugAGeneric.trim().toUpperCase() : null;
    }

    public String getDrugBGeneric() {
        return drugBGeneric;
    }

    public void setDrugBGeneric(String drugBGeneric) {
        this.drugBGeneric = drugBGeneric != null ? drugBGeneric.trim().toUpperCase() : null;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public String getInteractionTitle() {
        return interactionTitle;
    }

    public void setInteractionTitle(String interactionTitle) {
        this.interactionTitle = interactionTitle;
    }

    public String getClinicalEffect() {
        return clinicalEffect;
    }

    public void setClinicalEffect(String clinicalEffect) {
        this.clinicalEffect = clinicalEffect;
    }

    public String getRecommendation() {
        return recommendation;
    }

    public void setRecommendation(String recommendation) {
        this.recommendation = recommendation;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
