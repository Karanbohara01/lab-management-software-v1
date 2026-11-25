package np.com.lims.pharmacy.repository;

import np.com.lims.pharmacy.entity.PharmacyPurchase;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PharmacyPurchaseRepository extends JpaRepository<PharmacyPurchase, Long> {
    Page<PharmacyPurchase> findAllByOrderByReceivedDateDesc(Pageable pageable);
}
