package np.com.lims.platform;

import np.com.lims.platform.entity.PlatformIrdCredentials;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PlatformIrdCredentialsRepository extends JpaRepository<PlatformIrdCredentials, Long> {

    /** Singleton row — there is exactly one (or zero, before first save) for the whole deployment. */
    default Optional<PlatformIrdCredentials> findSingleton() {
        return findAll().stream().findFirst();
    }
}
