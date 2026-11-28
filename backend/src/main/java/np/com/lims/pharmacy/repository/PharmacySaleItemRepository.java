package np.com.lims.pharmacy.repository;

import np.com.lims.pharmacy.entity.PharmacySaleItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;

@Repository
public interface PharmacySaleItemRepository extends JpaRepository<PharmacySaleItem, Long> {

    @Query("SELECT COALESCE(SUM(si.unitsDeducted), 0) FROM PharmacySaleItem si " +
           "WHERE si.item.id = :itemId AND si.sale.createdAt >= :since")
    Long sumUnitsDeductedSince(@Param("itemId") Long itemId, @Param("since") Instant since);
}
