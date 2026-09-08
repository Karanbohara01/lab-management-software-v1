package np.com.lims.catalog;

import np.com.lims.catalog.entity.LabTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface LabTestRepository extends JpaRepository<LabTest, Long> {

    boolean existsByCodeIgnoreCase(String code);

    // Only one collection level in the graph — Hibernate cannot join-fetch two List collections at once.
    // referenceRanges load lazily inside the caller's read transaction.
    @EntityGraph(attributePaths = {"department", "parameters"})
    Optional<LabTest> findDetailedById(Long id);

    @EntityGraph(attributePaths = {"department", "parameters"})
    List<LabTest> findByIdInAndActiveTrue(List<Long> ids);

    @Query("""
            SELECT t FROM LabTest t
            WHERE (:search IS NULL
                   OR LOWER(t.name) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(t.code) LIKE LOWER(CONCAT('%', :search, '%')))
              AND (:departmentId IS NULL OR t.department.id = :departmentId)
              AND (:activeOnly = FALSE OR t.active = TRUE)
            """)
    Page<LabTest> search(@Param("search") String search,
                         @Param("departmentId") Long departmentId,
                         @Param("activeOnly") boolean activeOnly,
                         Pageable pageable);
}
