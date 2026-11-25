package np.com.lims.patient;

import np.com.lims.patient.entity.PatientDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PatientDocumentRepository extends JpaRepository<PatientDocument, Long> {

    @Query("SELECT d FROM PatientDocument d WHERE d.organizationId = :orgId AND d.patient.id = :patientId AND d.deleted = false ORDER BY d.uploadedAt DESC")
    List<PatientDocument> findAllByPatient(@Param("orgId") Long orgId, @Param("patientId") Long patientId);

    @Query("SELECT d FROM PatientDocument d WHERE d.organizationId = :orgId AND d.patient.id = :patientId AND d.id = :id AND d.deleted = false")
    Optional<PatientDocument> findByIdAndPatient(@Param("orgId") Long orgId, @Param("patientId") Long patientId, @Param("id") Long id);
}
