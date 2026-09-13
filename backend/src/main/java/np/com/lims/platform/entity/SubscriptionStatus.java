package np.com.lims.platform.entity;

/** Lifecycle of a clinic's subscription to a plan. */
public enum SubscriptionStatus {
    TRIALING, ACTIVE, PAST_DUE, SUSPENDED, CANCELLED;

    public boolean isBillable() {
        return this == ACTIVE || this == PAST_DUE;
    }
}
