package np.com.lims.inventory.entity;

import np.com.lims.common.exception.ApiException;

public enum PurchaseOrderStatus {
    DRAFT,
    SUBMITTED,
    PARTIALLY_RECEIVED,
    RECEIVED,
    CANCELLED;

    public void assertCanEditLines() {
        if (this != DRAFT) {
            throw ApiException.invalidTransition("Purchase order lines can only be changed while it is a draft");
        }
    }
}
