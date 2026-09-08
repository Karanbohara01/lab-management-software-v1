package np.com.lims.sample;

import np.com.lims.sample.entity.Sample;
import np.com.lims.sample.entity.SampleStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SampleRepository extends JpaRepository<Sample, Long> {

    @EntityGraph(attributePaths = {"patient", "order", "items"})
    Optional<Sample> findDetailedById(Long id);

    @EntityGraph(attributePaths = {"patient", "order", "items"})
    Optional<Sample> findByBarcodeValueIgnoreCase(String barcodeValue);

    boolean existsByOrderId(Long orderId);

    long countByStatus(SampleStatus status);

    @EntityGraph(attributePaths = {"patient", "order"})
    List<Sample> findByOrderIdOrderByIdAsc(Long orderId);

    @Query("""
            SELECT DISTINCT s FROM Sample s
            WHERE (:status IS NULL OR s.status = :status)
              AND (:orderId IS NULL OR s.order.id = :orderId)
              AND (:patientId IS NULL OR s.patient.id = :patientId)
              AND (:search IS NULL
                   OR LOWER(s.accessionNumber) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(s.patient.fullName) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(s.patient.mrn) LIKE LOWER(CONCAT('%', :search, '%')))
              AND (:departmentId IS NULL
                   OR EXISTS (SELECT 1 FROM SampleItem si WHERE si.sample = s AND si.departmentId = :departmentId))
            """)
    Page<Sample> search(@Param("status") SampleStatus status,
                        @Param("orderId") Long orderId,
                        @Param("patientId") Long patientId,
                        @Param("departmentId") Long departmentId,
                        @Param("search") String search,
                        Pageable pageable);

    @Query("SELECT s.status AS status, COUNT(s) AS count FROM Sample s GROUP BY s.status")
    List<StatusCount> countByStatus();

    interface StatusCount {
        SampleStatus getStatus();
        long getCount();
    }
}
