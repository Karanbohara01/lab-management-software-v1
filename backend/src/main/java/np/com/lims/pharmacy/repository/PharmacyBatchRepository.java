package np.com.lims.pharmacy.repository;

import np.com.lims.pharmacy.entity.PharmacyBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface PharmacyBatchRepository extends JpaRepository<PharmacyBatch, Long> {

    @Query("SELECT b FROM PharmacyBatch b WHERE b.item.id = :itemId AND b.remainingUnits > 0 AND b.isActive = true ORDER BY b.expiryDate ASC, b.id ASC")
    List<PharmacyBatch> findAvailableBatchesFefo(@Param("itemId") Long itemId);

    List<PharmacyBatch> findByRemainingUnitsGreaterThanOrderByExpiryDateAsc(int minUnits);

    @Query("SELECT b FROM PharmacyBatch b WHERE b.remainingUnits > 0 AND b.expiryDate <= :targetDate ORDER BY b.expiryDate ASC")
    List<PharmacyBatch> findExpiringOrExpired(@Param("targetDate") LocalDate targetDate);

    @Query("SELECT b FROM PharmacyBatch b WHERE b.remainingUnits > 0 AND b.expiryDate < :today ORDER BY b.expiryDate ASC")
    List<PharmacyBatch> findExpiredBatches(@Param("today") LocalDate today);

    @Query("SELECT b FROM PharmacyBatch b WHERE b.remainingUnits > 0 AND b.expiryDate >= :today AND b.expiryDate <= :inDays ORDER BY b.expiryDate ASC")
    List<PharmacyBatch> findNearExpiryBatches(@Param("today") LocalDate today, @Param("inDays") LocalDate inDays);

    java.util.Optional<PharmacyBatch> findFirstByItemIdOrderByCreatedAtDesc(Long itemId);
}
