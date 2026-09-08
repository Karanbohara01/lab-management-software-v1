package np.com.lims.billing.entity;

import java.math.BigDecimal;

/** Derived from net paid vs invoice total. Never persisted as authoritative state. */
public enum PaymentStatus {
    UNPAID,
    PARTIAL,
    PAID,
    OVERPAID;

    public static PaymentStatus of(BigDecimal total, BigDecimal netPaid) {
        int cmp = netPaid.compareTo(total);
        if (netPaid.signum() == 0) {
            return UNPAID;
        }
        if (cmp == 0) {
            return PAID;
        }
        return cmp > 0 ? OVERPAID : PARTIAL;
    }
}
