package np.com.lims.billing;

import np.com.lims.billing.entity.Invoice;
import np.com.lims.billing.entity.PaymentMethod;
import np.com.lims.billing.entity.PaymentStatus;
import np.com.lims.catalog.entity.LabTest;
import np.com.lims.common.exception.ApiException;
import np.com.lims.department.entity.Department;
import np.com.lims.order.OrderPricingCalculator;
import np.com.lims.order.entity.DiscountType;
import np.com.lims.order.entity.LabOrder;
import np.com.lims.patient.entity.Gender;
import np.com.lims.patient.entity.Patient;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class InvoicePaymentTest {

    private final OrderPricingCalculator calculator = new OrderPricingCalculator();

    private Invoice issuedInvoice(String... prices) {
        Department dept = Department.create("D", "Dept");
        Patient patient = Patient.register("P000001", "Test", Gender.OTHER);
        LabOrder order = LabOrder.open("ORD1", patient, null, null);
        for (int i = 0; i < prices.length; i++) {
            LabTest test = LabTest.create("T" + i, "Test " + i, dept);
            test.updateDetails("Test " + i, dept, null, null, null, null, new BigDecimal(prices[i]), null);
            order.addItem(test, 1, null);
        }
        Invoice invoice = Invoice.openFor(order, "2082/83");
        var r = calculator.calculate(order.getItems(), DiscountType.NONE, null, null);
        invoice.applyPricing(r.discountType(), r.discountValue(), r.taxRate(), r.subtotal(), r.discountAmount(),
                r.taxableAmount(), r.taxAmount(), r.totalAmount());
        invoice.issue("reception", "INV-2082/83-000001");
        return invoice;
    }

    @Test
    void partialThenFullPaymentUpdatesStatusAndBalance() {
        Invoice invoice = issuedInvoice("600.00", "900.00"); // total 1500

        invoice.recordPayment(new BigDecimal("500.00"), PaymentMethod.CASH, null, null, "reception");
        assertThat(invoice.balance()).isEqualByComparingTo("1000.00");
        assertThat(invoice.paymentStatus()).isEqualTo(PaymentStatus.PARTIAL);

        invoice.recordPayment(new BigDecimal("1000.00"), PaymentMethod.CARD, "txn-1", null, "reception");
        assertThat(invoice.balance()).isEqualByComparingTo("0.00");
        assertThat(invoice.paymentStatus()).isEqualTo(PaymentStatus.PAID);
    }

    @Test
    void rejectsOverpayment() {
        Invoice invoice = issuedInvoice("600.00");
        assertThatThrownBy(() -> invoice.recordPayment(new BigDecimal("700.00"), PaymentMethod.CASH, null, null, "x"))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void refundReducesNetPaidAndBlocksCancelUntilRefunded() {
        Invoice invoice = issuedInvoice("600.00");
        invoice.recordPayment(new BigDecimal("600.00"), PaymentMethod.CASH, null, null, "reception");

        assertThatThrownBy(() -> invoice.cancel("admin", "duplicate")).isInstanceOf(ApiException.class);

        var refund = invoice.requestRefund(new BigDecimal("600.00"), "duplicate order", null, "accountant");
        refund.approve("manager", null);
        invoice.applyApprovedRefund(refund);

        assertThat(invoice.netPaid()).isEqualByComparingTo("0.00");
        assertThat(invoice.balance()).isEqualByComparingTo("600.00");
    }

    @Test
    void refundCannotExceedNetPaid() {
        Invoice invoice = issuedInvoice("600.00");
        invoice.recordPayment(new BigDecimal("300.00"), PaymentMethod.CASH, null, null, "reception");
        assertThatThrownBy(() -> invoice.requestRefund(new BigDecimal("400.00"), "too much", null, "x"))
                .isInstanceOf(ApiException.class);
    }
}
