package np.com.lims.order.entity;

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
import np.com.lims.catalog.entity.LabTest;
import np.com.lims.common.audit.BaseEntity;
import np.com.lims.common.exception.ApiException;
import np.com.lims.doctor.entity.Doctor;
import np.com.lims.patient.entity.Patient;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "lab_order")
public class LabOrder extends BaseEntity {

    @Column(name = "order_number", nullable = false, length = 24, updatable = false)
    private String orderNumber;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "referring_doctor_id")
    private Doctor referringDoctor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private OrderStatus status = OrderStatus.DRAFT;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 12)
    private np.com.lims.common.model.Priority priority = np.com.lims.common.model.Priority.ROUTINE;

    @Column(name = "clinical_notes", length = 1000)
    private String clinicalNotes;

    @Column(name = "ordered_at", nullable = false)
    private Instant orderedAt;

    @Column(name = "confirmed_at")
    private Instant confirmedAt;

    @Column(name = "cancelled_at")
    private Instant cancelledAt;

    @Column(name = "cancel_reason", length = 500)
    private String cancelReason;

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

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    private List<LabOrderItem> items = new ArrayList<>();

    protected LabOrder() {
    }

    public static LabOrder open(String orderNumber, Patient patient, Doctor referringDoctor, String clinicalNotes) {
        LabOrder order = new LabOrder();
        order.orderNumber = orderNumber;
        order.patient = patient;
        order.referringDoctor = referringDoctor;
        order.clinicalNotes = clinicalNotes;
        order.status = OrderStatus.DRAFT;
        order.orderedAt = Instant.now();
        return order;
    }

    public void assertEditable() {
        if (!status.isEditable()) {
            throw ApiException.invalidTransition("Order " + orderNumber + " is " + status + " and can no longer be edited");
        }
    }

    public void updateHeader(Doctor referringDoctor, String clinicalNotes) {
        assertEditable();
        this.referringDoctor = referringDoctor;
        this.clinicalNotes = clinicalNotes;
    }

    public void applyPriority(np.com.lims.common.model.Priority priority) {
        this.priority = priority == null ? np.com.lims.common.model.Priority.ROUTINE : priority;
    }

    public np.com.lims.common.model.Priority getPriority() {
        return priority;
    }

    public void clearItems() {
        assertEditable();
        items.clear();
    }

    public LabOrderItem addItem(LabTest test, int quantity, BigDecimal lineDiscount) {
        assertEditable();
        LabOrderItem item = new LabOrderItem(this, test, quantity, lineDiscount);
        items.add(item);
        return item;
    }

    /** Overwrites the stored financial snapshot. Callers must pass values from the pricing calculator. */
    public void applyPricing(DiscountType discountType, BigDecimal discountValue, BigDecimal taxRate,
                             BigDecimal subtotal, BigDecimal discountAmount, BigDecimal taxableAmount,
                             BigDecimal taxAmount, BigDecimal totalAmount) {
        this.discountType = discountType;
        this.discountValue = discountValue;
        this.taxRate = taxRate;
        this.subtotal = subtotal;
        this.discountAmount = discountAmount;
        this.taxableAmount = taxableAmount;
        this.taxAmount = taxAmount;
        this.totalAmount = totalAmount;
    }

    public void confirm() {
        transitionTo(OrderStatus.CONFIRMED);
        if (items.isEmpty()) {
            throw ApiException.conflict("Cannot confirm an order with no tests");
        }
        this.confirmedAt = Instant.now();
    }

    public void cancel(String reason) {
        transitionTo(OrderStatus.CANCELLED);
        this.cancelledAt = Instant.now();
        this.cancelReason = reason;
    }

    private void transitionTo(OrderStatus target) {
        if (!status.canTransitionTo(target)) {
            throw ApiException.invalidTransition(
                    "Order " + orderNumber + " cannot move from " + status + " to " + target);
        }
        this.status = target;
    }

    public String getOrderNumber() {
        return orderNumber;
    }

    public Patient getPatient() {
        return patient;
    }

    public Doctor getReferringDoctor() {
        return referringDoctor;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public String getClinicalNotes() {
        return clinicalNotes;
    }

    public Instant getOrderedAt() {
        return orderedAt;
    }

    public Instant getConfirmedAt() {
        return confirmedAt;
    }

    public Instant getCancelledAt() {
        return cancelledAt;
    }

    public String getCancelReason() {
        return cancelReason;
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

    public List<LabOrderItem> getItems() {
        return items;
    }
}
