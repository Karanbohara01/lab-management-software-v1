package np.com.lims.pharmacy.repository;

import np.com.lims.pharmacy.entity.PharmacyReseller;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PharmacyResellerRepository extends JpaRepository<PharmacyReseller, Long> {
    List<PharmacyReseller> findByIsActiveTrueOrderByNameAsc();
}
