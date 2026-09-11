package np.com.lims.branch;

import np.com.lims.branch.entity.Branch;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BranchRepository extends JpaRepository<Branch, Long> {

    Optional<Branch> findByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCase(String code);

    List<Branch> findAllByOrderByNameAsc();

    List<Branch> findAllByActiveTrueOrderByNameAsc();

    Optional<Branch> findFirstByActiveTrueOrderByIdAsc();
}
