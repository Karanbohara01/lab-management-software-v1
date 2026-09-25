package np.com.lims.rbac.repository;

import np.com.lims.rbac.entity.Permission;
import np.com.lims.rbac.entity.PermissionName;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface PermissionRepository extends JpaRepository<Permission, Long> {

    List<Permission> findAllByOrderByNameAsc();

    List<Permission> findByNameIn(Collection<PermissionName> names);
}
