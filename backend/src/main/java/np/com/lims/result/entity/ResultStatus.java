package np.com.lims.result.entity;

import java.util.Set;

/**
 * Result lifecycle: technician enters, technician verifies, pathologist approves.
 * Approved results may be amended (with a reason and full history) but do not change status.
 */
public enum ResultStatus {
    PENDING,
    ENTERED,
    VERIFIED,
    APPROVED;

    private static final Set<ResultStatus> FROM_PENDING = Set.of(ENTERED);
    private static final Set<ResultStatus> FROM_ENTERED = Set.of(ENTERED, VERIFIED);
    private static final Set<ResultStatus> FROM_VERIFIED = Set.of(APPROVED, ENTERED);

    public boolean canTransitionTo(ResultStatus target) {
        return switch (this) {
            case PENDING -> FROM_PENDING.contains(target);
            case ENTERED -> FROM_ENTERED.contains(target);
            case VERIFIED -> FROM_VERIFIED.contains(target);
            case APPROVED -> false;
        };
    }

    public boolean isValueEditable() {
        return this == PENDING || this == ENTERED;
    }
}
