package np.com.lims.pharmacy.repository;

import np.com.lims.pharmacy.entity.PharmacyPatientAllergy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PharmacyPatientAllergyRepository extends JpaRepository<PharmacyPatientAllergy, Long> {
    List<PharmacyPatientAllergy> findByPatientId(Long patientId);
}
