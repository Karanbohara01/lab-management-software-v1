package np.com.lims.pharmacy.repository;

import np.com.lims.pharmacy.entity.PharmacySupplierReturn;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PharmacySupplierReturnRepository extends JpaRepository<PharmacySupplierReturn, Long> {

    Optional<PharmacySupplierReturn> findByDebitNoteNumber(String debitNoteNumber);

    Page<PharmacySupplierReturn> findByOrganizationIdOrderByCreatedAtDesc(Long organizationId, Pageable pageable);

    long countByOrganizationId(Long organizationId);
}
