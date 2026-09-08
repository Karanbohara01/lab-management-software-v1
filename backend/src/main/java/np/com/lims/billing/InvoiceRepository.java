package np.com.lims.billing;

import np.com.lims.billing.entity.Invoice;
import np.com.lims.billing.entity.InvoiceStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    @EntityGraph(attributePaths = {"patient", "order", "items"})
    Optional<Invoice> findDetailedById(Long id);

    @EntityGraph(attributePaths = {"patient", "order", "items"})
    Optional<Invoice> findByOrderId(Long orderId);

    boolean existsByOrderId(Long orderId);

    @Query("SELECT COALESCE(SUM(i.totalAmount - i.amountPaid + i.amountRefunded), 0) FROM Invoice i WHERE i.status = 'ISSUED'")
    java.math.BigDecimal totalOutstanding();

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Invoice i JOIN i.payments p "
            + "WHERE p.reversed = FALSE AND p.receivedAt >= :from")
    java.math.BigDecimal revenueSince(@Param("from") java.time.Instant from);

    @Query("SELECT CAST(p.receivedAt AS date), SUM(p.amount) FROM Invoice i JOIN i.payments p "
            + "WHERE p.reversed = FALSE AND p.receivedAt >= :from GROUP BY CAST(p.receivedAt AS date)")
    java.util.List<Object[]> dailyRevenue(@Param("from") java.time.Instant from);

    @Query("""
            SELECT i FROM Invoice i
            WHERE (:status IS NULL OR i.status = :status)
              AND (:patientId IS NULL OR i.patient.id = :patientId)
              AND (:unpaidOnly = FALSE OR (i.status = 'ISSUED' AND i.totalAmount > (i.amountPaid - i.amountRefunded)))
              AND (:search IS NULL
                   OR LOWER(COALESCE(i.invoiceNumber, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(i.patient.fullName) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(i.patient.mrn) LIKE LOWER(CONCAT('%', :search, '%')))
            """)
    Page<Invoice> search(@Param("status") InvoiceStatus status,
                         @Param("patientId") Long patientId,
                         @Param("unpaidOnly") boolean unpaidOnly,
                         @Param("search") String search,
                         Pageable pageable);
}
