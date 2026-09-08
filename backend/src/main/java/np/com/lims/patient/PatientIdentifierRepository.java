package np.com.lims.patient;

import np.com.lims.patient.entity.IdentifierType;
import np.com.lims.patient.entity.PatientIdentifier;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PatientIdentifierRepository extends JpaRepository<PatientIdentifier, Long> {

    List<PatientIdentifier> findByPatientIdOrderByPrimaryDescIdAsc(Long patientId);

    List<PatientIdentifier> findByTypeAndValueIgnoreCase(IdentifierType type, String value);

    void deleteByPatientId(Long patientId);

    /** Other patients (not this one) already holding the same document — a soft duplicate signal. */
    List<PatientIdentifier> findByTypeAndValueIgnoreCaseAndPatientIdNot(IdentifierType type, String value, Long patientId);
}
