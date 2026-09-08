package np.com.lims.inventory.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;

/** Immutable stock movement. {@code quantity} is signed: positive adds stock, negative removes it. */
@Entity
@Table(name = "stock_transaction")
public class StockTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "inventory_item_id", nullable = false)
    private InventoryItem item;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inventory_batch_id")
    private InventoryBatch batch;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private StockTransactionType type;

    @Column(nullable = false, precision = 14, scale = 3)
    private BigDecimal quantity;

    @Column(name = "balance_after", nullable = false, precision = 14, scale = 3)
    private BigDecimal balanceAfter;

    @Column(length = 300)
    private String reason;

    @Column(length = 120)
    private String reference;

    @Column(name = "performed_by", nullable = false, length = 100)
    private String performedBy;

    @Column(name = "occurred_at", nullable = false)
    private Instant occurredAt;

    protected StockTransaction() {
    }

    public StockTransaction(InventoryItem item, InventoryBatch batch, StockTransactionType type, BigDecimal quantity,
                            BigDecimal balanceAfter, String reason, String reference, String performedBy) {
        this.item = item;
        this.batch = batch;
        this.type = type;
        this.quantity = quantity;
        this.balanceAfter = balanceAfter;
        this.reason = reason;
        this.reference = reference;
        this.performedBy = performedBy;
        this.occurredAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public InventoryBatch getBatch() {
        return batch;
    }

    public StockTransactionType getType() {
        return type;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public BigDecimal getBalanceAfter() {
        return balanceAfter;
    }

    public String getReason() {
        return reason;
    }

    public String getReference() {
        return reference;
    }

    public String getPerformedBy() {
        return performedBy;
    }

    public Instant getOccurredAt() {
        return occurredAt;
    }
}
