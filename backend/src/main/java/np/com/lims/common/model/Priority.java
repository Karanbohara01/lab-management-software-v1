package np.com.lims.common.model;

/** Clinical urgency of an order and its results. Drives queue ordering and turnaround targets. */
public enum Priority {
    ROUTINE(1.0),
    URGENT(0.5),
    STAT(0.25);

    private final double turnaroundFactor;

    Priority(double turnaroundFactor) {
        this.turnaroundFactor = turnaroundFactor;
    }

    /** Fraction of the routine turnaround allowed for this priority. */
    public double turnaroundFactor() {
        return turnaroundFactor;
    }
}
