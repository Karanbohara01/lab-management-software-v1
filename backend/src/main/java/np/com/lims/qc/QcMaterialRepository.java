package np.com.lims.qc;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface QcMaterialRepository extends JpaRepository<QcMaterial, Long> {

    @EntityGraph(attributePaths = {"test", "targets", "targets.parameter"})
    List<QcMaterial> findAllByOrderByNameAscLevelAsc();

    @EntityGraph(attributePaths = {"test", "targets", "targets.parameter"})
    Optional<QcMaterial> findWithTargetsById(Long id);

    List<QcMaterial> findByTestIdAndActiveTrue(Long testId);
}
