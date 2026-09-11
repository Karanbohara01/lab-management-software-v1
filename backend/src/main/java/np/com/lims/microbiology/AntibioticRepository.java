package np.com.lims.microbiology;

import np.com.lims.microbiology.entity.Antibiotic;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AntibioticRepository extends JpaRepository<Antibiotic, Long> {

    List<Antibiotic> findAllByOrderByDrugClassAscNameAsc();

    List<Antibiotic> findAllByActiveTrueOrderByDrugClassAscNameAsc();

    Optional<Antibiotic> findByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCase(String code);
}
