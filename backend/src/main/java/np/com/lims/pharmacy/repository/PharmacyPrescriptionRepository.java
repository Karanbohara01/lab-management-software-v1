package np.com.lims.pharmacy.repository;

import np.com.lims.pharmacy.entity.PharmacyPrescription;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PharmacyPrescriptionRepository extends JpaRepository<PharmacyPrescription, Long> {

    Optional<PharmacyPrescription> findByPrescriptionNumber(String prescriptionNumber);

    List<PharmacyPrescription> findByPatientIdAndStatusInOrderByCreatedAtDesc(Long patientId, List<String> statuses);

    @Query("SELECT p FROM PharmacyPrescription p WHERE p.organizationId = :tenantId " +
           "AND (:query IS NULL OR LOWER(p.prescriptionNumber) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(p.patientName) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(p.patientMrn) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(p.doctorName) LIKE LOWER(CONCAT('%', :query, '%'))) " +
           "AND (:status IS NULL OR p.status = :status) " +
           "ORDER BY p.createdAt DESC")
    Page<PharmacyPrescription> searchPrescriptions(
            @Param("tenantId") Long tenantId,
            @Param("query") String query,
            @Param("status") String status,
            Pageable pageable
    );
}
