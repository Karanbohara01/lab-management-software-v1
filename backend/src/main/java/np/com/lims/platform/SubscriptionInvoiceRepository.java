package np.com.lims.platform;

import np.com.lims.platform.entity.SubscriptionInvoice;
import np.com.lims.platform.entity.SubscriptionInvoiceStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface SubscriptionInvoiceRepository extends JpaRepository<SubscriptionInvoice, Long> {

    Page<SubscriptionInvoice> findByOrganizationIdOrderByPeriodStartDesc(Long organizationId, Pageable pageable);

    Optional<SubscriptionInvoice> findByIdAndOrganizationId(Long id, Long organizationId);

    /** Most recent invoice for an organization, settled or not — used to decide the next period to bill. */
    Optional<SubscriptionInvoice> findFirstByOrganizationIdOrderByPeriodEndDesc(Long organizationId);

    List<SubscriptionInvoice> findByOrganizationIdAndStatus(Long organizationId, SubscriptionInvoiceStatus status);

    List<SubscriptionInvoice> findByStatusAndDueAtBefore(SubscriptionInvoiceStatus status, Instant cutoff);
}
