package np.com.lims.communication;

import np.com.lims.communication.entity.SmsCategory;
import np.com.lims.communication.entity.SmsTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SmsTemplateRepository extends JpaRepository<SmsTemplate, Long> {

    List<SmsTemplate> findAllByOrderByNameAsc();

    List<SmsTemplate> findByCategoryAndActiveTrueOrderByNameAsc(SmsCategory category);

    Optional<SmsTemplate> findByIdAndActiveTrue(Long id);
}
