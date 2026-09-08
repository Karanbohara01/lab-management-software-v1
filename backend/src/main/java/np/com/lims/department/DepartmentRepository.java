package np.com.lims.department;

import np.com.lims.department.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DepartmentRepository extends JpaRepository<Department, Long> {

    Optional<Department> findByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCase(String code);

    List<Department> findAllByOrderByNameAsc();

    List<Department> findAllByActiveTrueOrderByNameAsc();
}
