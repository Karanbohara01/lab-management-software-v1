package np.com.lims.rbac.repository;

import np.com.lims.rbac.entity.Role;
import np.com.lims.rbac.entity.RoleName;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Long> {

    @EntityGraph(attributePaths = "permissions")
    Optional<Role> findByName(RoleName name);

    @EntityGraph(attributePaths = "permissions")
    List<Role> findByNameIn(Collection<RoleName> names);

    @EntityGraph(attributePaths = "permissions")
    List<Role> findAllByOrderByNameAsc();
}
