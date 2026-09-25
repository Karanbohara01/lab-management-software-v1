package np.com.lims.platform;

import np.com.lims.platform.entity.Organization;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrganizationRepository extends JpaRepository<Organization, Long> {

    boolean existsBySlugIgnoreCase(String slug);

    @Query("SELECT o.id FROM Organization o WHERE o.status IN (np.com.lims.platform.entity.OrganizationStatus.TRIAL, np.com.lims.platform.entity.OrganizationStatus.ACTIVE)")
    java.util.List<Long> findActiveIds();

    @Query("""
            SELECT o FROM Organization o
            WHERE :q IS NULL
               OR LOWER(o.name) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(o.slug) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(o.contactEmail) LIKE LOWER(CONCAT('%', :q, '%'))
            """)
    Page<Organization> search(@Param("q") String query, Pageable pageable);
}
