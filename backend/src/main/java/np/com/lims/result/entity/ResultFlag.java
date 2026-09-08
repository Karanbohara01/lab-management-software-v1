package np.com.lims.result.entity;

/** Interpretation of a single parameter value against its reference range. */
public enum ResultFlag {
    NONE,
    NORMAL,
    LOW,
    HIGH,
    CRITICAL_LOW,
    CRITICAL_HIGH,
    ABNORMAL;

    public boolean isAbnormal() {
        return this == LOW || this == HIGH || this == ABNORMAL || isCritical();
    }

    public boolean isCritical() {
        return this == CRITICAL_LOW || this == CRITICAL_HIGH;
    }
}
