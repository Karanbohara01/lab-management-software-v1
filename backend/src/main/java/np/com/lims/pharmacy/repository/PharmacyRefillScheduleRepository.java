package np.com.lims.pharmacy.repository;

import np.com.lims.pharmacy.entity.PharmacyRefillSchedule;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface PharmacyRefillScheduleRepository extends JpaRepository<PharmacyRefillSchedule, Long> {

    @Query("SELECT r FROM PharmacyRefillSchedule r WHERE " +
           "(:status IS NULL OR r.status = :status) AND " +
           "(:query IS NULL OR LOWER(r.patientName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "r.patientPhone LIKE CONCAT('%', :query, '%') OR " +
           "LOWER(r.itemName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(r.invoiceNumber) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<PharmacyRefillSchedule> searchRefills(@Param("status") String status,
                                              @Param("query") String query,
                                              Pageable pageable);

    @Query("SELECT r FROM PharmacyRefillSchedule r WHERE r.status IN ('SCHEDULED', 'REMINDER_SENT') AND r.refillDueDate <= :targetDate")
    List<PharmacyRefillSchedule> findDueRefills(@Param("targetDate") LocalDate targetDate);

    long countByStatus(String status);

    @Query("SELECT COUNT(r) FROM PharmacyRefillSchedule r WHERE r.status IN ('SCHEDULED', 'REMINDER_SENT') AND r.refillDueDate < :today")
    long countOverdue(@Param("today") LocalDate today);

    @Query("SELECT COUNT(r) FROM PharmacyRefillSchedule r WHERE r.status IN ('SCHEDULED', 'REMINDER_SENT') AND r.refillDueDate BETWEEN :start AND :end")
    long countDueBetween(@Param("start") LocalDate start, @Param("end") LocalDate end);
}
