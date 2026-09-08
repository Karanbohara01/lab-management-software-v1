package np.com.lims.inventory;

import np.com.lims.inventory.entity.InventoryBatch;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface InventoryBatchRepository extends JpaRepository<InventoryBatch, Long> {

    @EntityGraph(attributePaths = {"item", "supplier"})
    Optional<InventoryBatch> findWithItemById(Long id);
}
