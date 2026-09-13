package np.com.lims.payment;

import np.com.lims.payment.entity.PaymentCredentials;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PaymentCredentialsRepository extends JpaRepository<PaymentCredentials, Long> {

    Optional<PaymentCredentials> findByOrganizationId(Long organizationId);
}
