package np.com.lims.order;

import np.com.lims.order.entity.LabOrder;
import np.com.lims.order.entity.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface LabOrderRepository extends JpaRepository<LabOrder, Long> {

    @EntityGraph(attributePaths = {"patient", "referringDoctor", "items"})
    Optional<LabOrder> findDetailedById(Long id);

    @Query("""
            SELECT o FROM LabOrder o
            WHERE (:patientId IS NULL OR o.patient.id = :patientId)
              AND (:status IS NULL OR o.status = :status)
              AND (:branchId IS NULL OR o.branch.id = :branchId)
              AND (:search IS NULL
                   OR LOWER(o.orderNumber) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(o.patient.fullName) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(o.patient.mrn) LIKE LOWER(CONCAT('%', :search, '%')))
            """)
    Page<LabOrder> search(@Param("patientId") Long patientId,
                          @Param("status") OrderStatus status,
                          @Param("branchId") Long branchId,
                          @Param("search") String search,
                          Pageable pageable);

    List<LabOrder> findByPatientIdOrderByOrderedAtDesc(Long patientId);

    long countByOrderedAtGreaterThanEqual(java.time.Instant from);

    @org.springframework.data.jpa.repository.Query("""
            SELECT o.referringDoctor.fullName, COUNT(o)
            FROM LabOrder o
            WHERE o.referringDoctor IS NOT NULL AND o.orderedAt >= :from
            GROUP BY o.referringDoctor.fullName ORDER BY COUNT(o) DESC
            """)
    java.util.List<Object[]> topReferrersSince(@org.springframework.data.repository.query.Param("from") java.time.Instant from,
                                               org.springframework.data.domain.Pageable pageable);
}
