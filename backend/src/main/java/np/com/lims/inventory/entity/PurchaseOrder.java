package np.com.lims.inventory.entity;

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

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "purchase_order")
public class PurchaseOrder extends BaseEntity {

    @Column(name = "po_number", nullable = false, length = 24, updatable = false)
    private String poNumber;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "supplier_id", nullable = false)
    private Supplier supplier;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private PurchaseOrderStatus status = PurchaseOrderStatus.DRAFT;

    @Column(name = "expected_date")
    private LocalDate expectedDate;

    @Column(length = 1000)
    private String notes;

    @Column(name = "submitted_at")
    private Instant submittedAt;
    @Column(name = "submitted_by", length = 100)
    private String submittedBy;
    @Column(name = "received_at")
    private Instant receivedAt;
    @Column(name = "received_by", length = 100)
    private String receivedBy;
    @Column(name = "cancelled_at")
    private Instant cancelledAt;
    @Column(name = "cancel_reason", length = 500)
    private String cancelReason;

    @OneToMany(mappedBy = "purchaseOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    private List<PurchaseOrderItem> items = new ArrayList<>();

    protected PurchaseOrder() {
    }

    public static PurchaseOrder draft(String poNumber, Supplier supplier, LocalDate expectedDate, String notes) {
        PurchaseOrder po = new PurchaseOrder();
        po.poNumber = poNumber;
        po.supplier = supplier;
        po.expectedDate = expectedDate;
        po.notes = notes;
        po.status = PurchaseOrderStatus.DRAFT;
        return po;
    }

    public void updateHeader(Supplier supplier, LocalDate expectedDate, String notes) {
        status.assertCanEditLines();
        this.supplier = supplier;
        this.expectedDate = expectedDate;
        this.notes = notes;
    }

    public void replaceItems(List<PurchaseOrderItem> newItems) {
        status.assertCanEditLines();
        items.clear();
        items.addAll(newItems);
    }

    public PurchaseOrderItem newItem(InventoryItem item, BigDecimal quantity, BigDecimal estimatedUnitCost) {
        return new PurchaseOrderItem(this, item, quantity, estimatedUnitCost);
    }

    public void submit(String actor) {
        if (status != PurchaseOrderStatus.DRAFT) {
            throw ApiException.invalidTransition("Only a draft purchase order can be submitted");
        }
        if (items.isEmpty()) {
            throw ApiException.conflict("Add at least one line before submitting");
        }
        this.status = PurchaseOrderStatus.SUBMITTED;
        this.submittedAt = Instant.now();
        this.submittedBy = actor;
    }

    public void markReceiptProgress(String actor) {
        if (status != PurchaseOrderStatus.SUBMITTED && status != PurchaseOrderStatus.PARTIALLY_RECEIVED) {
            throw ApiException.invalidTransition("Only a submitted purchase order can receive stock");
        }
        boolean allDone = items.stream().allMatch(PurchaseOrderItem::isFullyReceived);
        this.status = allDone ? PurchaseOrderStatus.RECEIVED : PurchaseOrderStatus.PARTIALLY_RECEIVED;
        if (allDone) {
            this.receivedAt = Instant.now();
            this.receivedBy = actor;
        }
    }

    public void cancel(String actor, String reason) {
        if (status == PurchaseOrderStatus.RECEIVED || status == PurchaseOrderStatus.CANCELLED) {
            throw ApiException.invalidTransition("Purchase order is " + status + " and cannot be cancelled");
        }
        this.status = PurchaseOrderStatus.CANCELLED;
        this.cancelledAt = Instant.now();
        this.cancelReason = reason;
    }

    public String getPoNumber() {
        return poNumber;
    }

    public Supplier getSupplier() {
        return supplier;
    }

    public PurchaseOrderStatus getStatus() {
        return status;
    }

    public LocalDate getExpectedDate() {
        return expectedDate;
    }

    public String getNotes() {
        return notes;
    }

    public Instant getSubmittedAt() {
        return submittedAt;
    }

    public Instant getReceivedAt() {
        return receivedAt;
    }

    public String getCancelReason() {
        return cancelReason;
    }

    public List<PurchaseOrderItem> getItems() {
        return items;
    }
}
