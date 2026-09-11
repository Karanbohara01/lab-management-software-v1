package np.com.lims.backup;

import np.com.lims.backup.entity.BackupRun;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BackupRunRepository extends JpaRepository<BackupRun, Long> {

    Page<BackupRun> findAllByOrderByStartedAtDesc(Pageable pageable);
}
