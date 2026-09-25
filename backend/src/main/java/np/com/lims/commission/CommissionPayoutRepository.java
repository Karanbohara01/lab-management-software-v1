package np.com.lims.commission;

import np.com.lims.commission.entity.CommissionPayout;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface CommissionPayoutRepository extends JpaRepository<CommissionPayout, Long> {

    List<CommissionPayout> findByDoctorIdOrderByPaidAtDesc(Long doctorId);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM CommissionPayout p WHERE p.doctorId = :doctorId")
    BigDecimal sumPaidByDoctor(@Param("doctorId") Long doctorId);

    @Query("SELECT p.doctorId AS doctorId, COALESCE(SUM(p.amount), 0) AS total FROM CommissionPayout p GROUP BY p.doctorId")
    List<CommissionEntryRepository.DoctorTotal> sumPaidByDoctorGrouped();
}
