package np.com.lims.inventory;

import np.com.lims.inventory.entity.StockTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StockTransactionRepository extends JpaRepository<StockTransaction, Long> {

    @EntityGraph(attributePaths = "batch")
    Page<StockTransaction> findByItemIdOrderByOccurredAtDesc(Long itemId, Pageable pageable);
}
