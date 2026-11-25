package np.com.lims.pharmacy.repository;

import np.com.lims.pharmacy.entity.PharmacySale;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface PharmacySaleRepository extends JpaRepository<PharmacySale, Long> {

    Page<PharmacySale> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT s FROM PharmacySale s WHERE s.createdAt >= :from AND s.createdAt <= :to ORDER BY s.createdAt DESC")
    List<PharmacySale> findSalesBetween(@Param("from") Instant from, @Param("to") Instant to);
}
