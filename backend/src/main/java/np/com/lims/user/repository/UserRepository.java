package np.com.lims.user.repository;

import np.com.lims.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    @EntityGraph(attributePaths = {"roles", "roles.permissions"})
    Optional<User> findByUsernameIgnoreCase(String username);

    @EntityGraph(attributePaths = {"roles"})
    Optional<User> findWithRolesById(Long id);

    boolean existsByUsernameIgnoreCase(String username);

    boolean existsByEmailIgnoreCase(String email);

    @Query("""
            SELECT u FROM User u
            WHERE (:q IS NULL
                   OR LOWER(u.username) LIKE LOWER(CONCAT('%', :q, '%'))
                   OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :q, '%'))
                   OR LOWER(u.email) LIKE LOWER(CONCAT('%', :q, '%')))
              AND (:enabledOnly = FALSE OR u.enabled = TRUE)
            """)
    @EntityGraph(attributePaths = {"roles"})
    Page<User> search(@Param("q") String query, @Param("enabledOnly") boolean enabledOnly, Pageable pageable);
}
