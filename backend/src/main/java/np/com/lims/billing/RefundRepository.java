package np.com.lims.billing;

import np.com.lims.billing.entity.Refund;
import np.com.lims.billing.entity.RefundStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RefundRepository extends JpaRepository<Refund, Long> {

    @EntityGraph(attributePaths = {"invoice", "invoice.patient", "payment"})
    Optional<Refund> findDetailedById(Long id);

    @EntityGraph(attributePaths = {"invoice", "invoice.patient"})
    Page<Refund> findByStatusOrderByRequestedAtDesc(RefundStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"invoice", "invoice.patient"})
    Page<Refund> findAllByOrderByRequestedAtDesc(Pageable pageable);
}
