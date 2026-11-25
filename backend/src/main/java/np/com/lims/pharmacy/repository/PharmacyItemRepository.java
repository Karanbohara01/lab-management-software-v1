package np.com.lims.pharmacy.repository;

import np.com.lims.pharmacy.entity.PharmacyItem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PharmacyItemRepository extends JpaRepository<PharmacyItem, Long> {

    @Query("SELECT p FROM PharmacyItem p WHERE p.isActive = true AND " +
           "(LOWER(p.name) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           " LOWER(p.genericName) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           " LOWER(p.barcode) LIKE LOWER(CONCAT('%', :q, '%')))")
    Page<PharmacyItem> searchActive(@Param("q") String query, Pageable pageable);

    Page<PharmacyItem> findByIsActiveTrueOrderByNameAsc(Pageable pageable);

    List<PharmacyItem> findTop20ByIsActiveTrueOrderByNameAsc();
}
