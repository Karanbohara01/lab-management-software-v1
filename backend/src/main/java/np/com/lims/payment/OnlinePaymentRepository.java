package np.com.lims.payment;

import np.com.lims.payment.entity.OnlinePayment;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OnlinePaymentRepository extends JpaRepository<OnlinePayment, Long> {

    @EntityGraph(attributePaths = {"invoice", "invoice.patient"})
    Optional<OnlinePayment> findDetailedById(Long id);

    Optional<OnlinePayment> findByTransactionUuid(String transactionUuid);

    @EntityGraph(attributePaths = {"invoice"})
    List<OnlinePayment> findByInvoiceIdOrderByInitiatedAtDesc(Long invoiceId);
}
