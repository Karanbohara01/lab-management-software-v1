package np.com.lims.order.entity;

import java.util.Set;

/**
 * Lab order lifecycle for Phase 2. Sample-collection / processing states are layered on in Phase 3.
 */
public enum OrderStatus {
    DRAFT,
    CONFIRMED,
    CANCELLED;

    private static final Set<OrderStatus> FROM_DRAFT = Set.of(CONFIRMED, CANCELLED);
    private static final Set<OrderStatus> FROM_CONFIRMED = Set.of(CANCELLED);

    public boolean canTransitionTo(OrderStatus target) {
        return switch (this) {
            case DRAFT -> FROM_DRAFT.contains(target);
            case CONFIRMED -> FROM_CONFIRMED.contains(target);
            case CANCELLED -> false;
        };
    }

    public boolean isEditable() {
        return this == DRAFT;
    }
}
