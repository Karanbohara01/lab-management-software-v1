package np.com.lims.messaging;

import np.com.lims.messaging.entity.SmsCredentials;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SmsCredentialsRepository extends JpaRepository<SmsCredentials, Long> {

    Optional<SmsCredentials> findByOrganizationId(Long organizationId);
}
