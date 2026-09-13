package np.com.lims.messaging;

import np.com.lims.messaging.entity.WhatsAppCredentials;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface WhatsAppCredentialsRepository extends JpaRepository<WhatsAppCredentials, Long> {

    Optional<WhatsAppCredentials> findByOrganizationId(Long organizationId);
}
