package np.com.lims.inventory;

import np.com.lims.common.exception.ApiException;
import np.com.lims.inventory.entity.InventoryItem;
import np.com.lims.inventory.entity.ItemCategory;
import np.com.lims.inventory.entity.StockStatus;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class InventoryItemTest {

    private final LocalDate today = LocalDate.of(2026, 9, 7);

    private InventoryItem item(String minStock) {
        InventoryItem i = InventoryItem.create("R1", "Reagent", ItemCategory.REAGENT, "tests");
        i.update("Reagent", ItemCategory.REAGENT, "tests", new BigDecimal(minStock), null, null);
        return i;
    }

    @Test
    void issuesFirstExpiryFirstOut() {
        InventoryItem i = item("0");
        i.receive("LATE", null, today, today.plusMonths(6), new BigDecimal("100"), null, null);
        i.receive("SOON", null, today, today.plusDays(10), new BigDecimal("40"), null, null);

        var draws = i.issueFefo(new BigDecimal("50"));

        assertThat(draws).hasSize(2);
        assertThat(draws.get(0).batch().getBatchNumber()).isEqualTo("SOON");
        assertThat(draws.get(0).taken()).isEqualByComparingTo("40");
        assertThat(draws.get(1).batch().getBatchNumber()).isEqualTo("LATE");
        assertThat(draws.get(1).taken()).isEqualByComparingTo("10");
        assertThat(i.quantityOnHand()).isEqualByComparingTo("90");
    }

    @Test
    void rejectsIssueBeyondStock() {
        InventoryItem i = item("0");
        i.receive("B", null, today, null, new BigDecimal("5"), null, null);
        assertThatThrownBy(() -> i.issueFefo(new BigDecimal("6"))).isInstanceOf(ApiException.class);
    }

    @Test
    void computesStatusByPriority() {
        InventoryItem low = item("50");
        low.receive("B", null, today, today.plusMonths(6), new BigDecimal("30"), null, null);
        assertThat(low.status(today, 30)).isEqualTo(StockStatus.LOW_STOCK);

        InventoryItem expiring = item("0");
        expiring.receive("B", null, today, today.plusDays(5), new BigDecimal("100"), null, null);
        assertThat(expiring.status(today, 30)).isEqualTo(StockStatus.EXPIRING_SOON);

        InventoryItem expired = item("0");
        expired.receive("B", null, today.minusMonths(2), today.minusDays(1), new BigDecimal("100"), null, null);
        assertThat(expired.status(today, 30)).isEqualTo(StockStatus.EXPIRED);

        InventoryItem out = item("0");
        assertThat(out.status(today, 30)).isEqualTo(StockStatus.OUT_OF_STOCK);
    }
}
