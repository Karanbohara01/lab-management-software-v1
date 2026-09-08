package np.com.lims.inventory;

import np.com.lims.inventory.entity.Supplier;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SupplierRepository extends JpaRepository<Supplier, Long> {

    @Query("SELECT s FROM Supplier s WHERE (:activeOnly = FALSE OR s.active = TRUE) "
            + "AND (:q IS NULL OR LOWER(s.name) LIKE LOWER(CONCAT('%', :q, '%'))) ORDER BY s.name ASC")
    Page<Supplier> search(@Param("q") String query, @Param("activeOnly") boolean activeOnly, Pageable pageable);

    List<Supplier> findAllByActiveTrueOrderByNameAsc();
}
