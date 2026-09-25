package np.com.lims.commission;

import np.com.lims.commission.entity.CommissionEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface CommissionEntryRepository extends JpaRepository<CommissionEntry, Long> {

    Optional<CommissionEntry> findByInvoiceId(Long invoiceId);

    Page<CommissionEntry> findByDoctorIdOrderByEarnedAtDesc(Long doctorId, Pageable pageable);

    List<CommissionEntry> findByDoctorIdOrderByEarnedAtDesc(Long doctorId);

    @Query("SELECT COALESCE(SUM(e.commissionAmount), 0) FROM CommissionEntry e WHERE e.doctorId = :doctorId")
    BigDecimal sumEarnedByDoctor(@Param("doctorId") Long doctorId);

    @Query("SELECT e.doctorId AS doctorId, COALESCE(SUM(e.commissionAmount), 0) AS total FROM CommissionEntry e GROUP BY e.doctorId")
    List<DoctorTotal> sumEarnedByDoctorGrouped();

    interface DoctorTotal {
        Long getDoctorId();
        BigDecimal getTotal();
    }
}
