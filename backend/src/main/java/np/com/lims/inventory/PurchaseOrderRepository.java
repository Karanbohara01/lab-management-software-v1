package np.com.lims.inventory;

import np.com.lims.inventory.entity.PurchaseOrder;
import np.com.lims.inventory.entity.PurchaseOrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long> {

    @EntityGraph(attributePaths = {"supplier", "items", "items.item"})
    Optional<PurchaseOrder> findDetailedById(Long id);

    @Query("""
            SELECT p FROM PurchaseOrder p
            WHERE (:status IS NULL OR p.status = :status)
              AND (:q IS NULL OR LOWER(p.poNumber) LIKE LOWER(CONCAT('%', :q, '%'))
                   OR LOWER(p.supplier.name) LIKE LOWER(CONCAT('%', :q, '%')))
            """)
    @EntityGraph(attributePaths = {"supplier", "items"})
    Page<PurchaseOrder> search(@Param("status") PurchaseOrderStatus status,
                               @Param("q") String query,
                               Pageable pageable);
}
