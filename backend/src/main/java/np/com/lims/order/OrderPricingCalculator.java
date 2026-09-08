package np.com.lims.order;

import np.com.lims.common.exception.ApiException;
import np.com.lims.common.exception.ErrorCode;
import np.com.lims.order.entity.DiscountType;
import np.com.lims.order.entity.LabOrderItem;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

/**
 * The single authoritative source of order financial totals. The frontend may preview totals,
 * but only the numbers this class produces are ever persisted.
 */
@Component
public class OrderPricingCalculator {

    private static final int MONEY_SCALE = 2;
    private static final BigDecimal HUNDRED = new BigDecimal("100");
    private static final BigDecimal MAX_TAX_RATE = new BigDecimal("100");

    public record Result(
            BigDecimal subtotal,
            DiscountType discountType,
            BigDecimal discountValue,
            BigDecimal discountAmount,
            BigDecimal taxableAmount,
            BigDecimal taxRate,
            BigDecimal taxAmount,
            BigDecimal totalAmount
    ) {
    }

    public Result calculate(List<LabOrderItem> items, DiscountType discountType,
                            BigDecimal discountValue, BigDecimal taxRate) {
        return compute(items.stream().map(LabOrderItem::getLineTotal).toList(), discountType, discountValue, taxRate);
    }

    /**
     * The core money formula, shared by order pricing and invoice billing: sum line totals,
     * apply the order/invoice-level discount, then tax, all rounded HALF_UP to 2dp.
     */
    public Result compute(List<BigDecimal> lineTotals, DiscountType discountType,
                          BigDecimal discountValue, BigDecimal taxRate) {
        DiscountType type = discountType == null ? DiscountType.NONE : discountType;
        BigDecimal value = nonNegative(discountValue);
        BigDecimal rate = nonNegative(taxRate);
        if (rate.compareTo(MAX_TAX_RATE) > 0) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "Tax rate must be between 0 and 100");
        }
        if (type == DiscountType.PERCENT && value.compareTo(HUNDRED) > 0) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "Percentage discount cannot exceed 100");
        }

        BigDecimal subtotal = lineTotals.stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(MONEY_SCALE, RoundingMode.HALF_UP);

        BigDecimal discountAmount = (switch (type) {
            case NONE -> BigDecimal.ZERO;
            case PERCENT -> subtotal.multiply(value).divide(HUNDRED, MONEY_SCALE, RoundingMode.HALF_UP);
            case AMOUNT -> value.min(subtotal);
        }).setScale(MONEY_SCALE, RoundingMode.HALF_UP);

        BigDecimal taxable = subtotal.subtract(discountAmount).max(BigDecimal.ZERO).setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        BigDecimal taxAmount = taxable.multiply(rate).divide(HUNDRED, MONEY_SCALE, RoundingMode.HALF_UP);
        BigDecimal total = taxable.add(taxAmount).setScale(MONEY_SCALE, RoundingMode.HALF_UP);

        return new Result(subtotal, type, value.setScale(MONEY_SCALE, RoundingMode.HALF_UP), discountAmount,
                taxable, rate.setScale(3, RoundingMode.HALF_UP), taxAmount, total);
    }

    private static BigDecimal nonNegative(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value.max(BigDecimal.ZERO);
    }
}
