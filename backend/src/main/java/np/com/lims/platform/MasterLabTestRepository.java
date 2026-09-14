package np.com.lims.platform;

import np.com.lims.platform.entity.MasterLabTest;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MasterLabTestRepository extends JpaRepository<MasterLabTest, Long> {

    @EntityGraph(attributePaths = {"parameters"})
    List<MasterLabTest> findAllByOrderByDisplayOrderAscIdAsc();

    @EntityGraph(attributePaths = {"parameters"})
    List<MasterLabTest> findAllByActiveTrueOrderByDisplayOrderAscIdAsc();

    @EntityGraph(attributePaths = {"parameters"})
    Optional<MasterLabTest> findDetailedById(Long id);

    boolean existsByCodeIgnoreCase(String code);

    @EntityGraph(attributePaths = {"parameters"})
    List<MasterLabTest> findByIdInAndActiveTrue(List<Long> ids);
}
