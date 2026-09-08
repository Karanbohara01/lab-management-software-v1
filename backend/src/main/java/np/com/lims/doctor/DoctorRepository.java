package np.com.lims.doctor;

import np.com.lims.doctor.entity.Doctor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DoctorRepository extends JpaRepository<Doctor, Long> {

    boolean existsByNmcNumberIgnoreCase(String nmcNumber);

    @Query("""
            SELECT d FROM Doctor d
            WHERE (:search IS NULL OR LOWER(d.fullName) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(COALESCE(d.specialization, '')) LIKE LOWER(CONCAT('%', :search, '%')))
              AND (:activeOnly = FALSE OR d.active = TRUE)
            """)
    Page<Doctor> search(@Param("search") String search,
                        @Param("activeOnly") boolean activeOnly,
                        Pageable pageable);
}
