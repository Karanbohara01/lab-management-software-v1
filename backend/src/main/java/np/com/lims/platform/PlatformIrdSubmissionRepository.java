package np.com.lims.platform;

import np.com.lims.ird.entity.IrdStatus;
import np.com.lims.platform.entity.PlatformIrdSubmission;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PlatformIrdSubmissionRepository extends JpaRepository<PlatformIrdSubmission, Long> {

    @EntityGraph(attributePaths = "subscriptionInvoice")
    Optional<PlatformIrdSubmission> findBySubscriptionInvoiceId(Long subscriptionInvoiceId);

    @EntityGraph(attributePaths = "subscriptionInvoice")
    Optional<PlatformIrdSubmission> findDetailedById(Long id);

    @Query("""
            SELECT s FROM PlatformIrdSubmission s JOIN FETCH s.subscriptionInvoice inv
            WHERE (:status IS NULL OR s.status = :status)
            ORDER BY inv.createdAt DESC
            """)
    java.util.List<PlatformIrdSubmission> findAllFiltered(@Param("status") IrdStatus status);
}
