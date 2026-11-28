package np.com.lims.pharmacy.repository;

import np.com.lims.pharmacy.entity.PharmacyPurchaseOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PharmacyPurchaseOrderRepository extends JpaRepository<PharmacyPurchaseOrder, Long> {

    Optional<PharmacyPurchaseOrder> findByPoNumber(String poNumber);

    @Query("SELECT po FROM PharmacyPurchaseOrder po WHERE " +
           "(:status IS NULL OR po.status = :status) AND " +
           "(:wholesalerId IS NULL OR po.wholesaler.id = :wholesalerId) AND " +
           "(:query IS NULL OR LOWER(po.poNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(po.wholesaler.name) LIKE LOWER(CONCAT('%', :query, '%'))) " +
           "ORDER BY po.createdAt DESC")
    Page<PharmacyPurchaseOrder> searchOrders(
            @Param("status") String status,
            @Param("wholesalerId") Long wholesalerId,
            @Param("query") String query,
            Pageable pageable);

    long countByStatus(String status);
}
