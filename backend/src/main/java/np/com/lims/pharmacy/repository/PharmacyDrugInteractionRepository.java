package np.com.lims.pharmacy.repository;

import np.com.lims.pharmacy.entity.PharmacyDrugInteraction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PharmacyDrugInteractionRepository extends JpaRepository<PharmacyDrugInteraction, Long> {

    @Query("SELECT i FROM PharmacyDrugInteraction i WHERE i.active = true AND " +
           "((i.drugAGeneric IN :generics AND i.drugBGeneric IN :generics))")
    List<PharmacyDrugInteraction> findMatchingInteractions(@Param("generics") List<String> generics);

    List<PharmacyDrugInteraction> findByActiveTrue();
}
