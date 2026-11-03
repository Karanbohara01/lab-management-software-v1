package np.com.lims.revenue;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import jakarta.persistence.TypedQuery;
import np.com.lims.billing.entity.PaymentMethod;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Collection;
import java.util.List;
import java.util.Map;

/**
 * Every revenue aggregate, as JPQL rooted at {@code Invoice} (or {@code Refund}) — the two
 * tenant-filtered entities — plus one native query for the day-by-day trend.
 *
 * <p>Three rules keep these honest, and every query here follows all three:
 * <ol>
 *   <li><b>Explicit tenant predicate.</b> The request-scoped Hibernate {@code tenantFilter} would
 *       scope these on its own, but a {@code WHERE i.organizationId = :orgId} is written into every
 *       statement anyway — so the figures are right even when no filter is enabled (a job, a test),
 *       and so {@code payment} and {@code invoice_item}, which carry no organization column, are
 *       only ever reached through their invoice.</li>
 *   <li><b>One date column per fact.</b> Billing uses {@code issuedAt}, collections
 *       {@code receivedAt}, refunds {@code decidedAt}, cancellations {@code cancelledAt}. Nothing is
 *       ever cut by {@code createdAt}.</li>
 *   <li><b>No money from the {@code reversed} flag.</b> A partial refund marks its whole payment
 *       reversed, and a refund raised without naming a payment marks nothing — so that flag can
 *       neither add nor subtract correctly. Payments are summed in full; approved refunds are
 *       subtracted on their own date. Over any invoice's lifetime that is exactly
 *       {@code amountPaid - amountRefunded}, the invoice's own definition of net paid.</li>
 * </ol>
 */
@Repository
public class RevenueQueries {

    /** The window and tenancy every query is cut by. */
    public record Scope(Long orgId, Long branchId, Instant from, Instant to) {
    }

    private static final String BRANCH = " AND (:branchId IS NULL OR i.order.branch.id = :branchId) ";

    private static final String ISSUED_IN_RANGE = " i.organizationId = :orgId AND i.status = 'ISSUED'"
            + " AND i.issuedAt >= :from AND i.issuedAt < :to" + BRANCH;

    private static final String PAID_IN_RANGE = " i.organizationId = :orgId"
            + " AND p.receivedAt >= :from AND p.receivedAt < :to" + BRANCH;

    private static final String REFUNDED_IN_RANGE = " r.organizationId = :orgId AND r.status = 'APPROVED'"
            + " AND r.decidedAt >= :from AND r.decidedAt < :to" + BRANCH;

    private static final String NET_PAID = "(i.amountPaid - i.amountRefunded)";
    private static final String BALANCE = "(i.totalAmount - i.amountPaid + i.amountRefunded)";
    /** An invoice's open balance, or zero when it is paid up (or overpaid). */
    private static final String OUTSTANDING = "CASE WHEN i.totalAmount > " + NET_PAID + " THEN " + BALANCE + " ELSE 0 END";
    private static final String HAS_BALANCE = "i.totalAmount > " + NET_PAID;

    /** A line's pro-rata share of what its invoice has actually been paid. */
    private static final String LINE_COLLECTED = "CASE WHEN i.subtotal > 0 THEN ii.lineTotal * " + NET_PAID + " / i.subtotal ELSE 0 END";
    /** A line's pro-rata share of what its invoice still owes. */
    private static final String LINE_OUTSTANDING = "CASE WHEN i.subtotal > 0 AND " + HAS_BALANCE
            + " THEN ii.lineTotal * " + BALANCE + " / i.subtotal ELSE 0 END";

    private static final DateTimeFormatter MYSQL_UTC = DateTimeFormatter.ofPattern("uuuu-MM-dd HH:mm:ss.SSSSSS")
            .withZone(ZoneOffset.UTC);

    @PersistenceContext
    private EntityManager em;

    // ----- billing (accrual: by issuedAt) ------------------------------------------------

    /**
     * @return count, subtotal, invoiceDiscount, taxable, tax, total, netPaidToDate, outstanding,
     *         outstandingInvoiceCount
     */
    public Object[] billingTotals(Scope s) {
        return single(bind(em.createQuery("SELECT COUNT(i),"
                + " COALESCE(SUM(i.subtotal), 0), COALESCE(SUM(i.discountAmount), 0),"
                + " COALESCE(SUM(i.taxableAmount), 0), COALESCE(SUM(i.taxAmount), 0), COALESCE(SUM(i.totalAmount), 0),"
                + " COALESCE(SUM(" + NET_PAID + "), 0), COALESCE(SUM(" + OUTSTANDING + "), 0),"
                + " COALESCE(SUM(CASE WHEN " + HAS_BALANCE + " THEN 1 ELSE 0 END), 0)"
                + " FROM Invoice i WHERE" + ISSUED_IN_RANGE, Object[].class), s));
    }

    /** @return grossCharges (unit price x quantity), lineDiscounts, testsOrdered (sum of quantity), itemCount */
    public Object[] itemTotals(Scope s) {
        return single(bind(em.createQuery("SELECT COALESCE(SUM(ii.unitPrice * ii.quantity), 0),"
                + " COALESCE(SUM(ii.lineDiscount), 0), COALESCE(SUM(ii.quantity), 0), COUNT(ii)"
                + " FROM Invoice i JOIN i.items ii WHERE" + ISSUED_IN_RANGE, Object[].class), s));
    }

    /** @return count, totalAmount — invoices cancelled in the window, by cancelledAt */
    public Object[] cancelledTotals(Scope s) {
        return single(bind(em.createQuery("SELECT COUNT(i), COALESCE(SUM(i.totalAmount), 0)"
                + " FROM Invoice i WHERE i.organizationId = :orgId AND i.status = 'CANCELLED'"
                + " AND i.cancelledAt >= :from AND i.cancelledAt < :to" + BRANCH, Object[].class), s));
    }

    /**
     * Invoices ISSUED in the window that have since been cancelled — the bridge between what the
     * period was billed at the time and what it reports now.
     *
     * <p>Cancelling mutates the invoice's status in place and keeps its amounts, so the billed
     * total (which excludes cancelled invoices, as a sale that was voided is not a sale) quietly
     * falls when an old invoice is voided later. Reporting this figure alongside it makes a
     * re-run of a closed period self-explaining instead of simply disagreeing with the printout
     * filed at the time: billed-as-issued = totalBilled + this.
     *
     * @return count, totalAmount
     */
    public Object[] issuedThenCancelled(Scope s) {
        return single(bind(em.createQuery("SELECT COUNT(i), COALESCE(SUM(i.totalAmount), 0)"
                + " FROM Invoice i WHERE i.organizationId = :orgId AND i.status = 'CANCELLED'"
                + " AND i.issuedAt >= :from AND i.issuedAt < :to" + BRANCH, Object[].class), s));
    }

    /** @return outstanding amount, invoice count — every issued invoice with a balance, as of now */
    public Object[] allTimeOutstanding(Long orgId, Long branchId) {
        TypedQuery<Object[]> q = em.createQuery("SELECT COALESCE(SUM(" + OUTSTANDING + "), 0),"
                + " COALESCE(SUM(CASE WHEN " + HAS_BALANCE + " THEN 1 ELSE 0 END), 0)"
                + " FROM Invoice i WHERE i.organizationId = :orgId AND i.status = 'ISSUED'" + BRANCH, Object[].class);
        q.setParameter("orgId", orgId);
        q.setParameter("branchId", branchId);
        return single(q);
    }

    // ----- collections (cash: by receivedAt) ----------------------------------------------

    /** @return paymentCount, grossCollected */
    public Object[] collectionTotals(Scope s) {
        return single(bind(em.createQuery("SELECT COUNT(p), COALESCE(SUM(p.amount), 0)"
                + " FROM Invoice i JOIN i.payments p WHERE" + PAID_IN_RANGE, Object[].class), s));
    }

    /** @return rows of (method, count, amount) */
    public List<Object[]> collectionsByMethod(Scope s) {
        return bind(em.createQuery("SELECT p.method, COUNT(p), SUM(p.amount)"
                + " FROM Invoice i JOIN i.payments p WHERE" + PAID_IN_RANGE
                + " GROUP BY p.method ORDER BY SUM(p.amount) DESC", Object[].class), s).getResultList();
    }

    /** @return rows of (receivedBy, count, amount) */
    public List<Object[]> collectionsByCashier(Scope s) {
        return bind(em.createQuery("SELECT p.receivedBy, COUNT(p), SUM(p.amount)"
                + " FROM Invoice i JOIN i.payments p WHERE" + PAID_IN_RANGE
                + " GROUP BY p.receivedBy ORDER BY SUM(p.amount) DESC", Object[].class), s).getResultList();
    }

    // ----- refunds (by decidedAt, APPROVED only) ---------------------------------------------

    /** @return count, amount */
    public Object[] refundTotals(Scope s) {
        return single(bind(em.createQuery("SELECT COUNT(r), COALESCE(SUM(r.amount), 0)"
                + " FROM Refund r JOIN r.invoice i WHERE" + REFUNDED_IN_RANGE, Object[].class), s));
    }

    // ----- breakdowns (over invoices issued in the window) -----------------------------------

    /**
     * One row per billed test code. Catalog metadata (current name, type, department, category)
     * is attached by a left join on the tenant's catalogue — a code that has since vanished still
     * reports under its snapshotted name, with no department or category.
     *
     * @return rows of (code, snapshotName, catalogName, type, departmentName, category,
     *         timesOrdered, invoices, gross, lineDiscount, netBilled, collectedAllocated,
     *         outstandingAllocated)
     */
    public List<Object[]> byTest(Scope s) {
        return bind(em.createQuery("SELECT ii.testCode, MAX(ii.testName), t.name, t.type, d.name, t.category,"
                + " SUM(ii.quantity), COUNT(DISTINCT i.id),"
                + " SUM(ii.unitPrice * ii.quantity), SUM(ii.lineDiscount), SUM(ii.lineTotal),"
                + " SUM(" + LINE_COLLECTED + "), SUM(" + LINE_OUTSTANDING + ")"
                + " FROM Invoice i JOIN i.items ii"
                + " LEFT JOIN LabTest t ON t.organizationId = i.organizationId AND t.code = ii.testCode"
                + " LEFT JOIN t.department d"
                + " WHERE" + ISSUED_IN_RANGE
                + " GROUP BY ii.testCode, t.name, t.type, d.name, t.category"
                + " ORDER BY SUM(ii.lineTotal) DESC, ii.testCode ASC", Object[].class), s).getResultList();
    }

    /** @return rows of (patientCategory, invoices, billed, invoiceDiscount, netPaid, outstanding) */
    public List<Object[]> byPatientCategory(Scope s) {
        return bind(em.createQuery("SELECT pt.category, COUNT(i), SUM(i.totalAmount), SUM(i.discountAmount),"
                + " SUM(" + NET_PAID + "), SUM(" + OUTSTANDING + ")"
                + " FROM Invoice i JOIN i.patient pt WHERE" + ISSUED_IN_RANGE
                + " GROUP BY pt.category ORDER BY SUM(i.totalAmount) DESC", Object[].class), s).getResultList();
    }

    /** @return rows of (payerType, payerName, invoices, billed, netPaid, outstanding) */
    public List<Object[]> byPayer(Scope s) {
        return bind(em.createQuery("SELECT pt.payer.type, pt.payer.name, COUNT(i), SUM(i.totalAmount),"
                + " SUM(" + NET_PAID + "), SUM(" + OUTSTANDING + ")"
                + " FROM Invoice i JOIN i.patient pt WHERE" + ISSUED_IN_RANGE
                + " GROUP BY pt.payer.type, pt.payer.name ORDER BY SUM(i.totalAmount) DESC", Object[].class), s)
                .getResultList();
    }

    /** @return rows of (doctorId, doctorName, invoices, billed, netPaid, outstanding), best first */
    public List<Object[]> byReferrer(Scope s, int limit) {
        return bind(em.createQuery("SELECT doc.id, doc.fullName, COUNT(i), SUM(i.totalAmount),"
                + " SUM(" + NET_PAID + "), SUM(" + OUTSTANDING + ")"
                + " FROM Invoice i JOIN i.order o JOIN o.referringDoctor doc WHERE" + ISSUED_IN_RANGE
                + " GROUP BY doc.id, doc.fullName ORDER BY SUM(i.totalAmount) DESC", Object[].class), s)
                .setMaxResults(limit).getResultList();
    }

    /** @return invoices, billed, netPaid, outstanding — for invoices with no referring doctor */
    public Object[] unreferred(Scope s) {
        return single(bind(em.createQuery("SELECT COUNT(i), COALESCE(SUM(i.totalAmount), 0),"
                + " COALESCE(SUM(" + NET_PAID + "), 0), COALESCE(SUM(" + OUTSTANDING + "), 0)"
                + " FROM Invoice i WHERE" + ISSUED_IN_RANGE + " AND i.order.referringDoctor IS NULL", Object[].class), s));
    }

    /** @return rows of (patientId, mrn, fullName, confidential, invoices, outstanding), largest first */
    public List<Object[]> topOutstandingPatients(Scope s, int limit) {
        return bind(em.createQuery("SELECT pt.id, pt.mrn, pt.fullName, pt.confidential, COUNT(i), SUM(" + BALANCE + ")"
                + " FROM Invoice i JOIN i.patient pt WHERE" + ISSUED_IN_RANGE + " AND " + HAS_BALANCE
                + " GROUP BY pt.id, pt.mrn, pt.fullName, pt.confidential ORDER BY SUM(" + BALANCE + ") DESC", Object[].class), s)
                .setMaxResults(limit).getResultList();
    }

    // ----- trend ------------------------------------------------------------------------------

    /**
     * Billed, collected and refunded per LOCAL day. Native, because grouping by the laboratory's
     * day means shifting UTC timestamps by the zone offset before truncating, which JPQL cannot
     * express; the tenant predicate is therefore written out on every branch. The bounds are
     * passed as UTC date-time literals so no driver-side zone conversion can touch them.
     *
     * @return rows of (java.sql.Date bucket, billed, collected, refunded)
     */
    public List<Object[]> dailyTrend(Scope s, String zoneOffset) {
        String sql = """
                SELECT b.bucket, COALESCE(SUM(b.billed), 0), COALESCE(SUM(b.collected), 0), COALESCE(SUM(b.refunded), 0)
                FROM (
                    SELECT DATE(CONVERT_TZ(i.issued_at, '+00:00', :tz)) AS bucket, i.total_amount AS billed, 0 AS collected, 0 AS refunded
                      FROM invoice i JOIN lab_order o ON o.id = i.lab_order_id
                     WHERE i.organization_id = :orgId AND i.status = 'ISSUED'
                       AND i.issued_at >= :fromUtc AND i.issued_at < :toUtc
                       AND (:branchId IS NULL OR o.branch_id = :branchId)
                    UNION ALL
                    SELECT DATE(CONVERT_TZ(p.received_at, '+00:00', :tz)), 0, p.amount, 0
                      FROM payment p JOIN invoice i ON i.id = p.invoice_id JOIN lab_order o ON o.id = i.lab_order_id
                     WHERE i.organization_id = :orgId
                       AND p.received_at >= :fromUtc AND p.received_at < :toUtc
                       AND (:branchId IS NULL OR o.branch_id = :branchId)
                    UNION ALL
                    SELECT DATE(CONVERT_TZ(r.decided_at, '+00:00', :tz)), 0, 0, r.amount
                      FROM refund r JOIN invoice i ON i.id = r.invoice_id JOIN lab_order o ON o.id = i.lab_order_id
                     WHERE r.organization_id = :orgId AND r.status = 'APPROVED'
                       AND r.decided_at >= :fromUtc AND r.decided_at < :toUtc
                       AND (:branchId IS NULL OR o.branch_id = :branchId)
                ) b
                GROUP BY b.bucket
                ORDER BY b.bucket
                """;
        Query q = em.createNativeQuery(sql);
        q.setParameter("tz", zoneOffset);
        q.setParameter("orgId", s.orgId());
        q.setParameter("branchId", s.branchId());
        q.setParameter("fromUtc", MYSQL_UTC.format(s.from()));
        q.setParameter("toUtc", MYSQL_UTC.format(s.to()));
        @SuppressWarnings("unchecked")
        List<Object[]> rows = q.getResultList();
        return rows;
    }

    // ----- registers (paged) -------------------------------------------------------------------

    public record Page<T>(List<T> rows, long total) {
    }

    /** Sortable columns of the payment register, by the names the API exposes. */
    public static final Map<String, String> PAYMENT_SORTS = Map.of(
            "receivedAt", "p.receivedAt", "amount", "p.amount", "method", "p.method",
            "invoice", "i.invoiceNumber", "receivedBy", "p.receivedBy");

    /** @return rows of (Payment, invoiceId, invoiceNumber, invoiceStatus, patientId, mrn, fullName, confidential) */
    public Page<Object[]> payments(Scope s, PaymentMethod method, String receivedBy, String orderBy,
                                   int page, int size) {
        String where = PAID_IN_RANGE
                + (method != null ? " AND p.method = :method" : "")
                + (receivedBy != null ? " AND p.receivedBy = :receivedBy" : "");
        TypedQuery<Object[]> rows = em.createQuery("SELECT p, i.id, i.invoiceNumber, i.status,"
                + " pt.id, pt.mrn, pt.fullName, pt.confidential"
                + " FROM Invoice i JOIN i.payments p JOIN i.patient pt WHERE" + where
                + " ORDER BY " + orderBy + ", p.id DESC", Object[].class);
        TypedQuery<Long> count = em.createQuery("SELECT COUNT(p) FROM Invoice i JOIN i.payments p WHERE" + where, Long.class);
        for (Query q : List.of(rows, count)) {
            bind(q, s);
            if (method != null) {
                q.setParameter("method", method);
            }
            if (receivedBy != null) {
                q.setParameter("receivedBy", receivedBy);
            }
        }
        return new Page<>(rows.setFirstResult(page * size).setMaxResults(size).getResultList(), count.getSingleResult());
    }

    /** @return rows of (paymentId, approvedRefundTotal) for the given payments */
    public List<Object[]> refundedPerPayment(Long orgId, Collection<Long> paymentIds) {
        if (paymentIds.isEmpty()) {
            return List.of();
        }
        return em.createQuery("SELECT r.payment.id, SUM(r.amount) FROM Refund r"
                + " WHERE r.organizationId = :orgId AND r.status = 'APPROVED' AND r.payment.id IN :ids"
                + " GROUP BY r.payment.id", Object[].class)
                .setParameter("orgId", orgId).setParameter("ids", paymentIds).getResultList();
    }

    public static final Map<String, String> REFUND_SORTS = Map.of(
            "decidedAt", "r.decidedAt", "amount", "r.amount", "invoice", "i.invoiceNumber");

    /** @return rows of (Refund, invoiceId, invoiceNumber, patientId, mrn, fullName, confidential, linkedPaymentMethod) */
    public Page<Object[]> refunds(Scope s, String orderBy, int page, int size) {
        TypedQuery<Object[]> rows = bind(em.createQuery("SELECT r, i.id, i.invoiceNumber,"
                + " pt.id, pt.mrn, pt.fullName, pt.confidential, pay.method"
                + " FROM Refund r JOIN r.invoice i JOIN i.patient pt LEFT JOIN r.payment pay WHERE" + REFUNDED_IN_RANGE
                + " ORDER BY " + orderBy + ", r.id DESC", Object[].class), s);
        TypedQuery<Long> count = bind(em.createQuery("SELECT COUNT(r) FROM Refund r JOIN r.invoice i WHERE"
                + REFUNDED_IN_RANGE, Long.class), s);
        return new Page<>(rows.setFirstResult(page * size).setMaxResults(size).getResultList(), count.getSingleResult());
    }

    public static final Map<String, String> OUTSTANDING_SORTS = Map.of(
            "balance", BALANCE, "issuedAt", "i.issuedAt", "total", "i.totalAmount",
            "invoice", "i.invoiceNumber", "patient", "pt.fullName");

    /**
     * @param inPeriod restrict to invoices issued in the window (otherwise every open invoice)
     * @return rows of (invoiceId, invoiceNumber, issuedAt, patientId, mrn, fullName, confidential,
     *         payerType, payerName, totalAmount, netPaid, balance)
     */
    public Page<Object[]> outstanding(Scope s, boolean inPeriod, String orderBy, int page, int size) {
        String where = " i.organizationId = :orgId AND i.status = 'ISSUED' AND " + HAS_BALANCE + BRANCH
                + (inPeriod ? " AND i.issuedAt >= :from AND i.issuedAt < :to" : "");
        TypedQuery<Object[]> rows = em.createQuery("SELECT i.id, i.invoiceNumber, i.issuedAt,"
                + " pt.id, pt.mrn, pt.fullName, pt.confidential, pt.payer.type, pt.payer.name,"
                + " i.totalAmount, " + NET_PAID + ", " + BALANCE
                + " FROM Invoice i JOIN i.patient pt WHERE" + where
                + " ORDER BY " + orderBy + ", i.id DESC", Object[].class);
        TypedQuery<Long> count = em.createQuery("SELECT COUNT(i) FROM Invoice i JOIN i.patient pt WHERE" + where, Long.class);
        for (Query q : List.of(rows, count)) {
            q.setParameter("orgId", s.orgId());
            q.setParameter("branchId", s.branchId());
            if (inPeriod) {
                q.setParameter("from", s.from());
                q.setParameter("to", s.to());
            }
        }
        return new Page<>(rows.setFirstResult(page * size).setMaxResults(size).getResultList(), count.getSingleResult());
    }

    // ----- helpers -----------------------------------------------------------------------------

    private static <Q extends Query> Q bind(Q q, Scope s) {
        q.setParameter("orgId", s.orgId());
        q.setParameter("branchId", s.branchId());
        q.setParameter("from", s.from());
        q.setParameter("to", s.to());
        return q;
    }

    private static Object[] single(TypedQuery<Object[]> q) {
        return q.getSingleResult();
    }

    /** Aggregates come back as whatever the dialect chose; every amount is normalised to a 2-dp BigDecimal. */
    public static BigDecimal money(Object value) {
        if (value == null) {
            return BigDecimal.ZERO.setScale(2);
        }
        BigDecimal bd = value instanceof BigDecimal b ? b : new BigDecimal(value.toString());
        return bd.setScale(2, java.math.RoundingMode.HALF_UP);
    }

    public static long count(Object value) {
        return value == null ? 0L : ((Number) value).longValue();
    }

    public static LocalDate day(Object value) {
        if (value instanceof java.sql.Date d) {
            return d.toLocalDate();
        }
        if (value instanceof LocalDate d) {
            return d;
        }
        return LocalDate.parse(value.toString());
    }
}
