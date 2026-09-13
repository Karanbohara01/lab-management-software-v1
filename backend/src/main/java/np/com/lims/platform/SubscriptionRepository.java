package np.com.lims.platform;

import np.com.lims.platform.entity.Subscription;
import np.com.lims.platform.entity.SubscriptionStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {

    @EntityGraph(attributePaths = {"plan"})
    Optional<Subscription> findFirstByOrganizationIdOrderByStartedAtDesc(Long organizationId);

    @EntityGraph(attributePaths = {"plan"})
    List<Subscription> findByOrganizationIdOrderByStartedAtDesc(Long organizationId);

    long countByStatus(SubscriptionStatus status);
}
