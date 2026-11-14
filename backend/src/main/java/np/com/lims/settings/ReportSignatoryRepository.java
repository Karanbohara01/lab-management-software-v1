package np.com.lims.settings;

import np.com.lims.settings.entity.ReportSignatory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReportSignatoryRepository extends JpaRepository<ReportSignatory, Long> {

    List<ReportSignatory> findAllByOrderByDisplayOrderAscIdAsc();
}
