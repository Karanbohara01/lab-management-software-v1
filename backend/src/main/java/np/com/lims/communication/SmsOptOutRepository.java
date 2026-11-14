package np.com.lims.communication;

import np.com.lims.communication.entity.SmsOptOut;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SmsOptOutRepository extends JpaRepository<SmsOptOut, Long> {

    boolean existsByPhone(String phone);

    Page<SmsOptOut> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
