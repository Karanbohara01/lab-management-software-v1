package np.com.lims.order;

import np.com.lims.catalog.entity.LabTest;
import np.com.lims.common.exception.ApiException;
import np.com.lims.department.entity.Department;
import np.com.lims.order.entity.DiscountType;
import np.com.lims.order.entity.LabOrder;
import np.com.lims.order.entity.LabOrderItem;
import np.com.lims.patient.entity.Gender;
import np.com.lims.patient.entity.Patient;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class OrderPricingCalculatorTest {

    private final OrderPricingCalculator calculator = new OrderPricingCalculator();

    private List<LabOrderItem> items(String... prices) {
        Department dept = Department.create("D", "Dept");
        Patient patient = Patient.register("P000001", "Test", Gender.OTHER);
        LabOrder order = LabOrder.open("ORD1", patient, null, null);
        for (int i = 0; i < prices.length; i++) {
            LabTest test = LabTest.create("T" + i, "Test " + i, dept);
            test.updateDetails("Test " + i, dept, null, null, null, null, new BigDecimal(prices[i]), null);
            order.addItem(test, 1, null);
        }
        return order.getItems();
    }

    @Test
    void sumsLineTotalsWithNoDiscountOrTax() {
        var result = calculator.calculate(items("600.00", "900.00"), DiscountType.NONE, null, null);
        assertThat(result.subtotal()).isEqualByComparingTo("1500.00");
        assertThat(result.discountAmount()).isEqualByComparingTo("0.00");
        assertThat(result.totalAmount()).isEqualByComparingTo("1500.00");
    }

    @Test
    void appliesPercentageDiscountThenTax() {
        var result = calculator.calculate(items("1000.00"), DiscountType.PERCENT,
                new BigDecimal("10"), new BigDecimal("13"));
        assertThat(result.discountAmount()).isEqualByComparingTo("100.00");
        assertThat(result.taxableAmount()).isEqualByComparingTo("900.00");
        assertThat(result.taxAmount()).isEqualByComparingTo("117.00");
        assertThat(result.totalAmount()).isEqualByComparingTo("1017.00");
    }

    @Test
    void clampsFlatDiscountToSubtotal() {
        var result = calculator.calculate(items("500.00"), DiscountType.AMOUNT, new BigDecimal("999"), null);
        assertThat(result.discountAmount()).isEqualByComparingTo("500.00");
        assertThat(result.taxableAmount()).isEqualByComparingTo("0.00");
        assertThat(result.totalAmount()).isEqualByComparingTo("0.00");
    }

    @Test
    void rejectsPercentageOverOneHundred() {
        assertThatThrownBy(() -> calculator.calculate(items("100.00"), DiscountType.PERCENT,
                new BigDecimal("150"), null))
                .isInstanceOf(ApiException.class);
    }
}
