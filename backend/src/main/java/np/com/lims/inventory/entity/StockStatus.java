package np.com.lims.inventory.entity;

/** Most urgent stock condition for an item, in priority order. */
public enum StockStatus {
    EXPIRED,
    OUT_OF_STOCK,
    LOW_STOCK,
    EXPIRING_SOON,
    IN_STOCK
}
