package np.com.lims.ird;

import np.com.lims.ird.entity.IrdStatus;
import np.com.lims.ird.entity.IrdSubmission;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface IrdSubmissionRepository extends JpaRepository<IrdSubmission, Long> {

    @EntityGraph(attributePaths = {"invoice", "invoice.patient", "attempts"})
    Optional<IrdSubmission> findDetailedById(Long id);

    @EntityGraph(attributePaths = {"invoice", "invoice.patient", "attempts"})
    Optional<IrdSubmission> findByInvoiceId(Long invoiceId);

    boolean existsByInvoiceId(Long invoiceId);

    long countByStatus(IrdStatus status);

    @Query("""
            SELECT s FROM IrdSubmission s
            WHERE (:status IS NULL OR s.status = :status)
              AND (:search IS NULL
                   OR LOWER(COALESCE(s.invoice.invoiceNumber, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(s.invoice.patient.fullName) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(s.invoice.patient.mrn) LIKE LOWER(CONCAT('%', :search, '%')))
            """)
    Page<IrdSubmission> search(@Param("status") IrdStatus status,
                               @Param("search") String search,
                               Pageable pageable);

    @Query("SELECT s.status AS status, COUNT(s) AS count FROM IrdSubmission s GROUP BY s.status")
    List<StatusCount> countByStatus();

    interface StatusCount {
        IrdStatus getStatus();
        long getCount();
    }
}
