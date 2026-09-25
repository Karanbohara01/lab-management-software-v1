package np.com.lims.catalog;

import np.com.lims.catalog.entity.ReflexRule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReflexRuleRepository extends JpaRepository<ReflexRule, Long> {

    List<ReflexRule> findBySourceTestIdAndActiveTrue(Long sourceTestId);

    List<ReflexRule> findAllByOrderBySourceTestIdAsc();
}
