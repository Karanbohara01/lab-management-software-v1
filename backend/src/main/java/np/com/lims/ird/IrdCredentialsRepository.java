package np.com.lims.ird;

import np.com.lims.ird.entity.IrdCredentials;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface IrdCredentialsRepository extends JpaRepository<IrdCredentials, Long> {

    Optional<IrdCredentials> findByOrganizationId(Long organizationId);
}
