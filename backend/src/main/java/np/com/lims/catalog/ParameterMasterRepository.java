package np.com.lims.catalog;

import np.com.lims.catalog.entity.ParameterMaster;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ParameterMasterRepository extends JpaRepository<ParameterMaster, Long> {

    /**
     * NOT tenant-filtered — {@code existsBy...} derived queries on a {@code @Filter}-carrying
     * entity were confirmed this session to bypass the Hibernate tenant filter (same gap found and
     * fixed on {@code UserRepository}). Always pass the organization id explicitly.
     */
    boolean existsByNameIgnoreCaseAndOrganizationId(String name, Long organizationId);

    /**
     * Explicitly scoped by {@code organizationId} rather than trusting the Hibernate tenant
     * filter alone — after this session's finding that some query shapes on this entity's sibling
     * (`UserRepository`) silently bypassed it, every query here is deliberately belt-and-braces.
     */
    @Query("""
            SELECT p FROM ParameterMaster p
            WHERE p.organizationId = :orgId
              AND (:q IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(p.code) LIKE LOWER(CONCAT('%', :q, '%')))
              AND (:activeOnly = FALSE OR p.active = TRUE)
            ORDER BY p.name ASC
            """)
    Page<ParameterMaster> search(@Param("orgId") Long organizationId, @Param("q") String query,
                                 @Param("activeOnly") boolean activeOnly, Pageable pageable);
}
