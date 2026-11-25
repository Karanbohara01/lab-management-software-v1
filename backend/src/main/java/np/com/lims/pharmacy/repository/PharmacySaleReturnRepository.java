package np.com.lims.pharmacy.repository;

import np.com.lims.pharmacy.entity.PharmacySaleReturn;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PharmacySaleReturnRepository extends JpaRepository<PharmacySaleReturn, Long> {

    Optional<PharmacySaleReturn> findByCreditNoteNumber(String creditNoteNumber);

    Page<PharmacySaleReturn> findByOrganizationIdOrderByCreatedAtDesc(Long organizationId, Pageable pageable);

    long countByOrganizationId(Long organizationId);
}
