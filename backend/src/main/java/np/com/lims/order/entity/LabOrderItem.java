package np.com.lims.order.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import np.com.lims.catalog.entity.LabTest;
import np.com.lims.common.audit.BaseEntity;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * A single ordered test. Test code/name/price are snapshotted at order time so later catalog
 * edits never change historical orders or invoices.
 */
@Entity
@Table(name = "lab_order_item")
public class LabOrderItem extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "lab_order_id", nullable = false)
    private LabOrder order;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "lab_test_id", nullable = false)
    private LabTest test;

    @Column(name = "test_code", nullable = false, length = 32)
    private String testCode;

    @Column(name = "test_name", nullable = false, length = 160)
    private String testName;

    @Column(name = "department_name", nullable = false, length = 120)
    private String departmentName;

    @Column(name = "unit_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;

    @Column(nullable = false)
    private int quantity = 1;

    @Column(name = "line_discount", nullable = false, precision = 12, scale = 2)
    private BigDecimal lineDiscount = BigDecimal.ZERO;

    @Column(name = "line_total", nullable = false, precision = 12, scale = 2)
    private BigDecimal lineTotal = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private OrderItemStatus status = OrderItemStatus.PENDING;

    protected LabOrderItem() {
    }

    LabOrderItem(LabOrder order, LabTest test, int quantity, BigDecimal lineDiscount) {
        this.order = order;
        this.test = test;
        this.testCode = test.getCode();
        this.testName = test.getName();
        this.departmentName = test.getDepartment().getName();
        this.unitPrice = test.getPrice();
        this.quantity = Math.max(1, quantity);
        this.lineDiscount = lineDiscount == null ? BigDecimal.ZERO : lineDiscount.max(BigDecimal.ZERO);
        recalculate();
    }

    void recalculate() {
        BigDecimal gross = unitPrice.multiply(BigDecimal.valueOf(quantity));
        BigDecimal discount = lineDiscount.min(gross);
        this.lineTotal = gross.subtract(discount).setScale(2, RoundingMode.HALF_UP);
    }

    public LabTest getTest() {
        return test;
    }

    public String getTestCode() {
        return testCode;
    }

    public String getTestName() {
        return testName;
    }

    public String getDepartmentName() {
        return departmentName;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public int getQuantity() {
        return quantity;
    }

    public BigDecimal getLineDiscount() {
        return lineDiscount;
    }

    public BigDecimal getLineTotal() {
        return lineTotal;
    }

    public OrderItemStatus getStatus() {
        return status;
    }
}
