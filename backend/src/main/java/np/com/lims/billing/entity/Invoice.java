package np.com.lims.billing.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import np.com.lims.common.audit.BaseEntity;
import np.com.lims.common.exception.ApiException;
import np.com.lims.order.entity.DiscountType;
import np.com.lims.order.entity.LabOrder;
import np.com.lims.patient.entity.Patient;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "invoice")
public class Invoice extends BaseEntity {

    @Column(name = "invoice_number", length = 32, unique = true)
    private String invoiceNumber;

    @Column(name = "fiscal_year", nullable = false, length = 16)
    private String fiscalYear;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "lab_order_id", nullable = false, updatable = false)
    private LabOrder order;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "patient_id", nullable = false, updatable = false)
    private Patient patient;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private InvoiceStatus status = InvoiceStatus.DRAFT;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "discount_type", nullable = false, length = 16)
    private DiscountType discountType = DiscountType.NONE;

    @Column(name = "discount_value", nullable = false, precision = 12, scale = 2)
    private BigDecimal discountValue = BigDecimal.ZERO;

    @Column(name = "discount_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "taxable_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal taxableAmount = BigDecimal.ZERO;

    @Column(name = "tax_rate", nullable = false, precision = 6, scale = 3)
    private BigDecimal taxRate = BigDecimal.ZERO;

    @Column(name = "tax_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(name = "amount_paid", nullable = false, precision = 12, scale = 2)
    private BigDecimal amountPaid = BigDecimal.ZERO;

    @Column(name = "amount_refunded", nullable = false, precision = 12, scale = 2)
    private BigDecimal amountRefunded = BigDecimal.ZERO;

    @Column(name = "issued_at")
    private Instant issuedAt;
    @Column(name = "issued_by", length = 100)
    private String issuedBy;
    @Column(name = "cancelled_at")
    private Instant cancelledAt;
    @Column(name = "cancelled_by", length = 100)
    private String cancelledBy;
    @Column(name = "cancel_reason", length = 500)
    private String cancelReason;
    @Column(length = 1000)
    private String notes;

    // Per the e-invoice procedure (दफा ६(च)): a bill number may print as the ORIGINAL only once
    // per fiscal year; any further print of the same invoice number must show a "Copy of
    // Original" watermark, and how many times it has been reprinted must be tracked.
    @Column(name = "print_count", nullable = false)
    private int printCount;

    @Column(name = "last_printed_at")
    private Instant lastPrintedAt;

    @Column(name = "last_printed_by", length = 100)
    private String lastPrintedBy;

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    private List<InvoiceItem> items = new ArrayList<>();

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("receivedAt ASC, id ASC")
    private List<Payment> payments = new ArrayList<>();

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("requestedAt ASC, id ASC")
    private List<Refund> refunds = new ArrayList<>();

    protected Invoice() {
    }

    public static Invoice openFor(LabOrder order, String fiscalYear) {
        Invoice invoice = new Invoice();
        invoice.order = order;
        invoice.patient = order.getPatient();
        invoice.fiscalYear = fiscalYear;
        invoice.status = InvoiceStatus.DRAFT;
        order.getItems().forEach(item -> invoice.items.add(new InvoiceItem(invoice,
                item.getTestCode(), item.getTestName(), item.getUnitPrice(), item.getQuantity(),
                item.getLineDiscount())));
        return invoice;
    }

    public void applyPricing(DiscountType discountType, BigDecimal discountValue, BigDecimal taxRate,
                             BigDecimal subtotal, BigDecimal discountAmount, BigDecimal taxableAmount,
                             BigDecimal taxAmount, BigDecimal totalAmount) {
        assertDraft();
        this.discountType = discountType;
        this.discountValue = discountValue;
        this.taxRate = taxRate;
        this.subtotal = subtotal;
        this.discountAmount = discountAmount;
        this.taxableAmount = taxableAmount;
        this.taxAmount = taxAmount;
        this.totalAmount = totalAmount;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public void issue(String actor, String invoiceNumber) {
        assertDraft();
        if (items.isEmpty()) {
            throw ApiException.conflict("Cannot issue an invoice with no items");
        }
        this.invoiceNumber = invoiceNumber;
        this.status = InvoiceStatus.ISSUED;
        this.issuedAt = Instant.now();
        this.issuedBy = actor;
    }

    public void cancel(String actor, String reason) {
        if (status == InvoiceStatus.CANCELLED) {
            throw ApiException.invalidTransition("Invoice is already cancelled");
        }
        // Net of refunds, not raw amountPaid — otherwise a fully-refunded invoice could never be
        // cancelled, since amountPaid never decreases (only amountRefunded grows to offset it).
        if (netPaid().signum() > 0) {
            throw ApiException.conflict("Refund all payments before cancelling this invoice");
        }
        this.status = InvoiceStatus.CANCELLED;
        this.cancelledAt = Instant.now();
        this.cancelledBy = actor;
        this.cancelReason = reason;
    }

    /**
     * Registers a print (or reprint) of this invoice, returning the sequence number of THIS
     * print (1 = the original; 2+ = a reprint that must be watermarked "Copy of Original").
     */
    public int recordPrint(String actor) {
        this.printCount += 1;
        this.lastPrintedAt = Instant.now();
        this.lastPrintedBy = actor;
        return this.printCount;
    }

    public Payment recordPayment(BigDecimal amount, PaymentMethod method, String reference, String note, String actor) {
        if (status != InvoiceStatus.ISSUED) {
            throw ApiException.conflict("Payments can only be recorded against an issued invoice");
        }
        if (amount == null || amount.signum() <= 0) {
            throw ApiException.conflict("Payment amount must be greater than zero");
        }
        if (netPaid().add(amount).compareTo(totalAmount) > 0) {
            throw ApiException.conflict("Payment exceeds the outstanding balance of " + balance());
        }
        Payment payment = new Payment(this, amount, method, reference, note, actor);
        payments.add(payment);
        this.amountPaid = this.amountPaid.add(amount);
        return payment;
    }

    public Refund requestRefund(BigDecimal amount, String reason, Payment payment, String actor) {
        if (amount == null || amount.signum() <= 0) {
            throw ApiException.conflict("Refund amount must be greater than zero");
        }
        BigDecimal alreadyPending = refunds.stream()
                .filter(r -> r.getStatus() == RefundStatus.REQUESTED)
                .map(Refund::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        if (amount.add(alreadyPending).compareTo(netPaid()) > 0) {
            throw ApiException.conflict("Refund exceeds the refundable amount of " + netPaid().subtract(alreadyPending));
        }
        Refund refund = new Refund(this, payment, amount, reason, actor);
        refunds.add(refund);
        return refund;
    }

    /** Applied by the refund service after approval — reduces the net paid amount. */
    public void applyApprovedRefund(Refund refund) {
        this.amountRefunded = this.amountRefunded.add(refund.getAmount());
        if (refund.getPayment() != null) {
            refund.getPayment().markReversed();
        }
    }

    public BigDecimal netPaid() {
        return amountPaid.subtract(amountRefunded);
    }

    public BigDecimal balance() {
        return totalAmount.subtract(netPaid());
    }

    public PaymentStatus paymentStatus() {
        return PaymentStatus.of(totalAmount, netPaid());
    }

    private void assertDraft() {
        if (status != InvoiceStatus.DRAFT) {
            throw ApiException.invalidTransition("Invoice " + invoiceNumber + " is " + status + " and can no longer be edited");
        }
    }

    // getters ---------------------------------------------------------

    public String getInvoiceNumber() {
        return invoiceNumber;
    }

    public String getFiscalYear() {
        return fiscalYear;
    }

    public LabOrder getOrder() {
        return order;
    }

    public Patient getPatient() {
        return patient;
    }

    public InvoiceStatus getStatus() {
        return status;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public DiscountType getDiscountType() {
        return discountType;
    }

    public BigDecimal getDiscountValue() {
        return discountValue;
    }

    public BigDecimal getDiscountAmount() {
        return discountAmount;
    }

    public BigDecimal getTaxableAmount() {
        return taxableAmount;
    }

    public BigDecimal getTaxRate() {
        return taxRate;
    }

    public BigDecimal getTaxAmount() {
        return taxAmount;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public BigDecimal getAmountPaid() {
        return amountPaid;
    }

    public BigDecimal getAmountRefunded() {
        return amountRefunded;
    }

    public Instant getIssuedAt() {
        return issuedAt;
    }

    public String getIssuedBy() {
        return issuedBy;
    }

    public Instant getCancelledAt() {
        return cancelledAt;
    }

    public String getCancelledBy() {
        return cancelledBy;
    }

    public String getCancelReason() {
        return cancelReason;
    }

    public String getNotes() {
        return notes;
    }

    public int getPrintCount() {
        return printCount;
    }

    public Instant getLastPrintedAt() {
        return lastPrintedAt;
    }

    public String getLastPrintedBy() {
        return lastPrintedBy;
    }

    public List<InvoiceItem> getItems() {
        return items;
    }

    public List<Payment> getPayments() {
        return payments;
    }

    public List<Refund> getRefunds() {
        return refunds;
    }
}
