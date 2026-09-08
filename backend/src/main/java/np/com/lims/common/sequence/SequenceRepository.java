package np.com.lims.common.sequence;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import java.util.Optional;

public interface SequenceRepository extends JpaRepository<AppSequence, String> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<AppSequence> findByName(String name);
}
