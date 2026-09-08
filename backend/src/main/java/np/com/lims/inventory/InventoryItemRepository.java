package np.com.lims.inventory;

import np.com.lims.inventory.entity.InventoryItem;
import np.com.lims.inventory.entity.ItemCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface InventoryItemRepository extends JpaRepository<InventoryItem, Long> {

    boolean existsByCodeIgnoreCase(String code);

    @EntityGraph(attributePaths = {"department", "batches", "batches.supplier"})
    Optional<InventoryItem> findDetailedById(Long id);

    @EntityGraph(attributePaths = {"department", "batches"})
    List<InventoryItem> findByActiveTrue();

    @Query("""
            SELECT i FROM InventoryItem i
            WHERE (:q IS NULL OR LOWER(i.name) LIKE LOWER(CONCAT('%', :q, '%'))
                   OR LOWER(i.code) LIKE LOWER(CONCAT('%', :q, '%')))
              AND (:category IS NULL OR i.category = :category)
              AND (:departmentId IS NULL OR i.department.id = :departmentId)
              AND (:activeOnly = FALSE OR i.active = TRUE)
            """)
    @EntityGraph(attributePaths = {"department", "batches"})
    Page<InventoryItem> search(@Param("q") String query,
                               @Param("category") ItemCategory category,
                               @Param("departmentId") Long departmentId,
                               @Param("activeOnly") boolean activeOnly,
                               Pageable pageable);
}
