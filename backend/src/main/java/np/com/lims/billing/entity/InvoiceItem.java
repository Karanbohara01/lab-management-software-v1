package np.com.lims.billing.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import np.com.lims.common.audit.BaseEntity;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Entity
@Table(name = "invoice_item")
public class InvoiceItem extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "invoice_id", nullable = false)
    private Invoice invoice;

    @Column(name = "test_code", nullable = false, length = 32)
    private String testCode;

    @Column(name = "test_name", nullable = false, length = 160)
    private String testName;

    @Column(name = "unit_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;

    @Column(nullable = false)
    private int quantity = 1;

    @Column(name = "line_discount", nullable = false, precision = 12, scale = 2)
    private BigDecimal lineDiscount = BigDecimal.ZERO;

    @Column(name = "line_total", nullable = false, precision = 12, scale = 2)
    private BigDecimal lineTotal = BigDecimal.ZERO;

    protected InvoiceItem() {
    }

    InvoiceItem(Invoice invoice, String testCode, String testName, BigDecimal unitPrice, int quantity,
                BigDecimal lineDiscount) {
        this.invoice = invoice;
        this.testCode = testCode;
        this.testName = testName;
        this.unitPrice = unitPrice;
        this.quantity = Math.max(1, quantity);
        this.lineDiscount = lineDiscount == null ? BigDecimal.ZERO : lineDiscount.max(BigDecimal.ZERO);
        BigDecimal gross = unitPrice.multiply(BigDecimal.valueOf(this.quantity));
        this.lineTotal = gross.subtract(this.lineDiscount.min(gross)).setScale(2, RoundingMode.HALF_UP);
    }

    public String getTestCode() {
        return testCode;
    }

    public String getTestName() {
        return testName;
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
}
