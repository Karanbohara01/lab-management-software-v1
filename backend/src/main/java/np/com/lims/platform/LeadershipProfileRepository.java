package np.com.lims.platform;

import np.com.lims.platform.entity.LeadershipProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LeadershipProfileRepository extends JpaRepository<LeadershipProfile, Long> {

    /** Page order; ties (two with the same order) fall back to the order they were added. */
    List<LeadershipProfile> findAllByOrderByDisplayOrderAscIdAsc();

    /** The profile that is last on the page, so a new one can go after it. */
    Optional<LeadershipProfile> findFirstByOrderByDisplayOrderDescIdDesc();
}
