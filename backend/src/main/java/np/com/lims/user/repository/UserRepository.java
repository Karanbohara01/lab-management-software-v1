package np.com.lims.user.repository;

import np.com.lims.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * NOT automatically tenant-filtered, despite {@code User} carrying the Hibernate
     * {@code @Filter} — confirmed live that this derived query, and the two {@code existsBy...}
     * ones below, return/count rows across EVERY organization regardless of whether the request's
     * tenant filter is enabled (unlike a plain {@code findById}, which is the only case this
     * codebase had previously confirmed bypasses the filter — this is a second, distinct way to
     * accidentally see cross-tenant data, apparently specific to how Spring Data builds these
     * particular derived queries). Only ever call this where a cross-tenant search is actually
     * wanted (nothing currently does); every other call site must use the org-scoped variant.
     */
    @EntityGraph(attributePaths = {"roles", "roles.permissions"})
    Optional<User> findByUsernameIgnoreCase(String username);

    /**
     * Every account (across every organization) whose username matches, case-insensitively.
     * Usernames are only unique WITHIN an organization ({@code UNIQUE (organization_id, username)}
     * — by design, so each clinic can have its own "admin"), so a global, case-insensitive lookup
     * can legitimately return more than one row once two different clinics pick overlapping
     * usernames. {@code AuthService.login} is the only caller that should ever need this — it must
     * expect and handle more than one result, by testing the submitted password against each
     * candidate.
     */
    @EntityGraph(attributePaths = {"roles", "roles.permissions"})
    List<User> findAllByUsernameIgnoreCase(String username);

    @EntityGraph(attributePaths = {"roles"})
    Optional<User> findWithRolesById(Long id);

    /**
     * NOT tenant-filtered — see {@link #findByUsernameIgnoreCase}'s javadoc. Safe here because,
     * unlike username, email is globally unique ({@code UNIQUE (email)}, no per-org qualifier), so
     * this can never return more than one row. Used only by the unauthenticated forgot-password
     * flow, which by definition has no tenant context to filter by yet.
     */
    Optional<User> findByEmailIgnoreCase(String email);

    /** NOT tenant-filtered — see {@link #findByUsernameIgnoreCase}'s javadoc. Use the org-scoped overload below instead. */
    boolean existsByUsernameIgnoreCase(String username);

    /** NOT tenant-filtered — see {@link #findByUsernameIgnoreCase}'s javadoc. Use the org-scoped overload below instead. */
    boolean existsByEmailIgnoreCase(String email);

    /** The org-scoped username-uniqueness check every call site except {@code AuthService.login} should use. */
    boolean existsByUsernameIgnoreCaseAndOrganizationId(String username, Long organizationId);

    /** The org-scoped email-uniqueness check every call site except {@code AuthService.login} should use. */
    boolean existsByEmailIgnoreCaseAndOrganizationId(String email, Long organizationId);

    long countByEnabledTrue();

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
