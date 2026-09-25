package np.com.lims.catalog.entity;

/** What a {@link ReflexRule} fires on, matching {@code TestResult#hasAbnormal}/{@code hasCritical}. */
public enum ReflexTrigger {
    /** Any abnormal flag (LOW/HIGH/ABNORMAL) on the source result, critical included. */
    ABNORMAL,
    /** Only a critical flag (CRITICAL_LOW/CRITICAL_HIGH) on the source result. */
    CRITICAL
}
