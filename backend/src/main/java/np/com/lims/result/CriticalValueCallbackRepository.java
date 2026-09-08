package np.com.lims.result;

import np.com.lims.result.entity.CriticalValueCallback;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CriticalValueCallbackRepository extends JpaRepository<CriticalValueCallback, Long> {
    List<CriticalValueCallback> findByResultIdOrderByNotifiedAtDesc(Long resultId);
}
