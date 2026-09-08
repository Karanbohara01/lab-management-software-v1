package np.com.lims.patient;

import np.com.lims.patient.entity.Patient;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface PatientRepository extends JpaRepository<Patient, Long> {

    @EntityGraph(attributePaths = "referringDoctor")
    Optional<Patient> findWithDoctorById(Long id);

    long countByCreatedAtGreaterThanEqual(java.time.Instant from);

    @Query("""
            SELECT p FROM Patient p
            WHERE (:search IS NULL
                   OR LOWER(p.fullName) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(p.mrn) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(COALESCE(p.externalMrn, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(COALESCE(p.email, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR p.phone LIKE CONCAT('%', :search, '%')
                   OR (:digits <> '' AND COALESCE(p.phoneDigits, '') LIKE CONCAT('%', :digits, '%')))
              AND (:activeOnly = FALSE OR p.active = TRUE)
              AND (:category IS NULL OR p.category = :category)
              AND (:includeConfidential = TRUE OR p.confidential = FALSE)
              AND p.mergedIntoId IS NULL
            """)
    Page<Patient> search(@Param("search") String search,
                         @Param("digits") String digits,
                         @Param("activeOnly") boolean activeOnly,
                         @Param("category") np.com.lims.patient.entity.PatientCategory category,
                         @Param("includeConfidential") boolean includeConfidential,
                         Pageable pageable);

    /**
     * A loose candidate pool for duplicate detection — anything sharing the normalised phone,
     * the longest name token, or the exact date of birth. Final scoring is done in the service.
     */
    @Query("""
            SELECT p FROM Patient p
            WHERE (:phoneDigits IS NOT NULL AND p.phoneDigits = :phoneDigits)
               OR (:nameToken IS NOT NULL AND LOWER(p.fullName) LIKE :nameToken)
               OR (:dob IS NOT NULL AND p.dateOfBirth = :dob)
            """)
    List<Patient> findMatchPool(@Param("phoneDigits") String phoneDigits,
                                @Param("nameToken") String nameToken,
                                @Param("dob") LocalDate dob,
                                Pageable limit);
}
