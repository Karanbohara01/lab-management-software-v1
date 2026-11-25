package np.com.lims.pharmacy.repository;

import np.com.lims.pharmacy.entity.PharmacyWholesaler;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PharmacyWholesalerRepository extends JpaRepository<PharmacyWholesaler, Long> {
    List<PharmacyWholesaler> findByIsActiveTrueOrderByNameAsc();
}
