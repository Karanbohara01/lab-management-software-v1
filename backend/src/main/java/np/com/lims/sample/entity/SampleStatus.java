package np.com.lims.sample.entity;

import java.util.Set;

/** Physical lifecycle of a specimen. Processing/completion is driven by results (Phase 3B). */
public enum SampleStatus {
    AWAITING_COLLECTION,
    COLLECTED,
    RECEIVED,
    REJECTED;

    private static final Set<SampleStatus> FROM_AWAITING = Set.of(COLLECTED);
    private static final Set<SampleStatus> FROM_COLLECTED = Set.of(RECEIVED, REJECTED);
    private static final Set<SampleStatus> FROM_RECEIVED = Set.of(REJECTED);
    private static final Set<SampleStatus> FROM_REJECTED = Set.of(AWAITING_COLLECTION);

    public boolean canTransitionTo(SampleStatus target) {
        return switch (this) {
            case AWAITING_COLLECTION -> FROM_AWAITING.contains(target);
            case COLLECTED -> FROM_COLLECTED.contains(target);
            case RECEIVED -> FROM_RECEIVED.contains(target);
            case REJECTED -> FROM_REJECTED.contains(target);
        };
    }
}
