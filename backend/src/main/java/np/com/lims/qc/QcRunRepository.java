package np.com.lims.qc;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface QcRunRepository extends JpaRepository<QcRun, Long> {

    List<QcRun> findByMaterialIdAndParameterIdOrderByRunAtDesc(Long materialId, Long parameterId, Pageable pageable);

    List<QcRun> findByTestIdOrderByRunAtDesc(Long testId, Pageable pageable);

    /** The most recent run per (material, parameter) for a test — used for the lockout decision. */
    @Query("""
            SELECT r FROM QcRun r
            WHERE r.test.id = :testId
              AND r.runAt = (SELECT MAX(r2.runAt) FROM QcRun r2
                             WHERE r2.material.id = r.material.id AND r2.parameter.id = r.parameter.id)
            """)
    List<QcRun> findLatestPerSeriesForTest(@Param("testId") Long testId);
}
