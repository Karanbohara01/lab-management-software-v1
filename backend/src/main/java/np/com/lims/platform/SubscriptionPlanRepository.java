package np.com.lims.platform;

import np.com.lims.platform.entity.SubscriptionPlan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SubscriptionPlanRepository extends JpaRepository<SubscriptionPlan, Long> {

    List<SubscriptionPlan> findAllByOrderByDisplayOrderAsc();

    Optional<SubscriptionPlan> findByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCase(String code);
}
