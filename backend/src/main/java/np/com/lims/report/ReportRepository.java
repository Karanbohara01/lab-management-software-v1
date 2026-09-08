package np.com.lims.report;

import np.com.lims.report.entity.Report;
import np.com.lims.report.entity.ReportStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ReportRepository extends JpaRepository<Report, Long> {

    @EntityGraph(attributePaths = {"patient", "order", "tests"})
    Optional<Report> findDetailedById(Long id);

    @EntityGraph(attributePaths = {"patient", "order", "tests"})
    Optional<Report> findByOrderId(Long orderId);

    Optional<Report> findByVerificationToken(String verificationToken);

    boolean existsByOrderId(Long orderId);

    long countByGeneratedAtGreaterThanEqual(java.time.Instant from);

    @Query("""
            SELECT r FROM Report r
            WHERE (:status IS NULL OR r.status = :status)
              AND (:patientId IS NULL OR r.patient.id = :patientId)
              AND (:search IS NULL
                   OR LOWER(r.reportNumber) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(r.patient.fullName) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(r.patient.mrn) LIKE LOWER(CONCAT('%', :search, '%')))
            """)
    Page<Report> search(@Param("status") ReportStatus status,
                        @Param("patientId") Long patientId,
                        @Param("search") String search,
                        Pageable pageable);
}
