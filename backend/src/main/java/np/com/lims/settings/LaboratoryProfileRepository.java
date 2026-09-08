package np.com.lims.settings;

import np.com.lims.settings.entity.LaboratoryProfile;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LaboratoryProfileRepository extends JpaRepository<LaboratoryProfile, Long> {
}
