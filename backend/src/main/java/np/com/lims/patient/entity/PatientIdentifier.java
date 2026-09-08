package np.com.lims.patient.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import np.com.lims.common.audit.BaseEntity;

import java.time.LocalDate;

@Entity
@Table(name = "patient_identifier")
public class PatientIdentifier extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @Enumerated(EnumType.STRING)
    @Column(name = "id_type", nullable = false, length = 32)
    private IdentifierType type;

    @Column(name = "id_value", nullable = false, length = 60)
    private String value;

    @Column(name = "issued_place", length = 120)
    private String issuedPlace;

    @Column(name = "issued_date")
    private LocalDate issuedDate;

    @Column(name = "is_primary", nullable = false)
    private boolean primary;

    @Column(length = 200)
    private String note;

    protected PatientIdentifier() {
    }

    public PatientIdentifier(Patient patient, IdentifierType type, String value, String issuedPlace,
                             LocalDate issuedDate, boolean primary, String note) {
        this.patient = patient;
        this.type = type;
        this.value = value;
        this.issuedPlace = issuedPlace;
        this.issuedDate = issuedDate;
        this.primary = primary;
        this.note = note;
    }

    public void reassignTo(Patient newPatient) {
        this.patient = newPatient;
        this.primary = false;
    }

    public Patient getPatient() {
        return patient;
    }

    public IdentifierType getType() {
        return type;
    }

    public String getValue() {
        return value;
    }

    public String getIssuedPlace() {
        return issuedPlace;
    }

    public LocalDate getIssuedDate() {
        return issuedDate;
    }

    public boolean isPrimary() {
        return primary;
    }

    public String getNote() {
        return note;
    }
}
