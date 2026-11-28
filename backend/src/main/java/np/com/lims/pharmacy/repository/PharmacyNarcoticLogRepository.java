package np.com.lims.pharmacy.repository;

import np.com.lims.pharmacy.entity.PharmacyNarcoticLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PharmacyNarcoticLogRepository extends JpaRepository<PharmacyNarcoticLog, Long> {

    Page<PharmacyNarcoticLog> findByOrganizationIdOrderByLogDateDesc(Long organizationId, Pageable pageable);

    @Query("SELECT n FROM PharmacyNarcoticLog n WHERE n.organizationId = :organizationId " +
           "AND (:query IS NULL OR LOWER(n.patientName) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(n.buyerName) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(n.doctorName) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(n.doctorNmcNumber) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(n.prescriptionNumber) LIKE LOWER(CONCAT('%', :query, '%'))) " +
           "ORDER BY n.logDate DESC")
    Page<PharmacyNarcoticLog> searchLogs(@Param("organizationId") Long organizationId,
                                        @Param("query") String query,
                                        Pageable pageable);

    List<PharmacyNarcoticLog> findByOrganizationIdAndLogDateBetweenOrderByLogDateAsc(
            Long organizationId, LocalDateTime start, LocalDateTime end);

    List<PharmacyNarcoticLog> findByOrganizationIdAndItemIdOrderByLogDateDesc(Long organizationId, Long itemId);
}
