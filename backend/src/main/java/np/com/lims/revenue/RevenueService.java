package np.com.lims.revenue;

import np.com.lims.billing.entity.Payment;
import np.com.lims.billing.entity.PaymentMethod;
import np.com.lims.billing.entity.PaymentStatus;
import np.com.lims.billing.entity.Refund;
import np.com.lims.catalog.entity.TestType;
import np.com.lims.common.api.PageResponse;
import np.com.lims.common.exception.ApiException;
import np.com.lims.common.exception.ErrorCode;
import np.com.lims.common.tenant.TenantContext;
import np.com.lims.common.web.CurrentUser;
import np.com.lims.patient.PatientPrivacy;
import np.com.lims.patient.entity.PatientCategory;
import np.com.lims.patient.entity.PayerType;
import np.com.lims.revenue.RevenueDtos.BillingSummary;
import np.com.lims.revenue.RevenueDtos.Breakdown;
import np.com.lims.revenue.RevenueDtos.CancelledSummary;
import np.com.lims.revenue.RevenueDtos.CashierTotal;
import np.com.lims.revenue.RevenueDtos.CollectionSummary;
import np.com.lims.revenue.RevenueDtos.Comparison;
import np.com.lims.revenue.RevenueDtos.Granularity;
import np.com.lims.revenue.RevenueDtos.GroupRow;
import np.com.lims.revenue.RevenueDtos.LabHeader;
import np.com.lims.revenue.RevenueDtos.MethodTotal;
import np.com.lims.revenue.RevenueDtos.OutstandingRow;
import np.com.lims.revenue.RevenueDtos.OutstandingScope;
import np.com.lims.revenue.RevenueDtos.OutstandingSummary;
import np.com.lims.revenue.RevenueDtos.PatientCategoryRow;
import np.com.lims.revenue.RevenueDtos.PatientOutstandingRow;
import np.com.lims.revenue.RevenueDtos.PayerRow;
import np.com.lims.revenue.RevenueDtos.PaymentRow;
import np.com.lims.revenue.RevenueDtos.Period;
import np.com.lims.revenue.RevenueDtos.ReferrerRow;
import np.com.lims.revenue.RevenueDtos.RefundRow;
import np.com.lims.revenue.RevenueDtos.RefundSummary;
import np.com.lims.revenue.RevenueDtos.Register;
import np.com.lims.revenue.RevenueDtos.Report;
import np.com.lims.revenue.RevenueDtos.Summary;
import np.com.lims.revenue.RevenueDtos.TestRow;
import np.com.lims.revenue.RevenueDtos.Trend;
import np.com.lims.revenue.RevenueDtos.TrendPoint;
import np.com.lims.revenue.RevenuePeriod.Range;
import np.com.lims.revenue.RevenueQueries.Scope;
import np.com.lims.settings.LaboratoryProfileService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

import static np.com.lims.revenue.RevenueQueries.count;
import static np.com.lims.revenue.RevenueQueries.day;
import static np.com.lims.revenue.RevenueQueries.money;

/**
 * The revenue figures, assembled from {@link RevenueQueries}. The dashboard, the registers and the
 * printed report all come through here with the same {@link Range}, which is what guarantees the
 * printout shows exactly what the screen showed.
 */
@Service
public class RevenueService {

    /** Same ceiling as invoice export: beyond this a register is cut and flagged, never silently. */
    static final int REGISTER_LIMIT = 10_000;
    private static final int TOP_REFERRERS = 25;
    private static final int TOP_PATIENTS = 20;
    private static final int MAX_PAGE_SIZE = 200;

    private final RevenueQueries queries;
    private final LaboratoryProfileService laboratoryProfileService;

    public RevenueService(RevenueQueries queries, LaboratoryProfileService laboratoryProfileService) {
        this.queries = queries;
        this.laboratoryProfileService = laboratoryProfileService;
    }

    // ----- summary -------------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public Summary summary(Range range, Long branchId) {
        Scope scope = scope(range, branchId);
        BillingSummary billing = billing(scope);
        CollectionSummary collections = collections(scope);
        RefundSummary refunds = refunds(scope);
        Object[] cancelled = queries.cancelledTotals(scope);
        Object[] voidedLater = queries.issuedThenCancelled(scope);
        Object[] open = queries.allTimeOutstanding(scope.orgId(), scope.branchId());

        return new Summary(
                Period.from(range),
                billing,
                collections,
                refunds,
                collections.grossCollected().subtract(refunds.amount()),
                new CancelledSummary(count(cancelled[0]), money(cancelled[1]),
                        count(voidedLater[0]), money(voidedLater[1]),
                        billing.totalBilled().add(money(voidedLater[1]))),
                new OutstandingSummary(money(open[0]), count(open[1])),
                comparison(range.previous(), scope.branchId()),
                LabHeader.from(laboratoryProfileService.require()),
                Instant.now(),
                CurrentUser.username());
    }

    private BillingSummary billing(Scope scope) {
        Object[] inv = queries.billingTotals(scope);
        Object[] items = queries.itemTotals(scope);
        BigDecimal lineDiscounts = money(items[1]);
        BigDecimal invoiceDiscounts = money(inv[2]);
        return new BillingSummary(
                count(inv[0]), count(items[3]), count(items[2]),
                money(items[0]), lineDiscounts, invoiceDiscounts, lineDiscounts.add(invoiceDiscounts),
                money(inv[1]), money(inv[3]), money(inv[4]), money(inv[5]),
                money(inv[6]), money(inv[7]), count(inv[8]));
    }

    private CollectionSummary collections(Scope scope) {
        Object[] total = queries.collectionTotals(scope);
        List<MethodTotal> byMethod = queries.collectionsByMethod(scope).stream()
                .map(r -> new MethodTotal((PaymentMethod) r[0], count(r[1]), money(r[2]))).toList();
        List<CashierTotal> byCashier = queries.collectionsByCashier(scope).stream()
                .map(r -> new CashierTotal((String) r[0], count(r[1]), money(r[2]))).toList();
        BigDecimal onAccount = byMethod.stream().filter(m -> m.method() == PaymentMethod.CREDIT)
                .map(MethodTotal::amount).reduce(BigDecimal.ZERO, BigDecimal::add).setScale(2);
        BigDecimal gross = money(total[1]);
        return new CollectionSummary(count(total[0]), gross, gross.subtract(onAccount), onAccount, byMethod, byCashier);
    }

    private RefundSummary refunds(Scope scope) {
        Object[] r = queries.refundTotals(scope);
        return new RefundSummary(count(r[0]), money(r[1]));
    }

    private Comparison comparison(Range range, Long branchId) {
        Scope scope = scope(range, branchId);
        Object[] inv = queries.billingTotals(scope);
        Object[] paid = queries.collectionTotals(scope);
        Object[] refunded = queries.refundTotals(scope);
        BigDecimal gross = money(paid[1]);
        BigDecimal refunds = money(refunded[1]);
        return new Comparison(Period.from(range), money(inv[5]), gross, refunds, gross.subtract(refunds),
                count(inv[0]), count(paid[0]));
    }

    // ----- breakdown -----------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public Breakdown breakdown(Range range, Long branchId) {
        Scope scope = scope(range, branchId);

        List<TestRow> byTest = queries.byTest(scope).stream().map(r -> new TestRow(
                (String) r[0],
                r[2] != null ? (String) r[2] : (String) r[1],
                (TestType) r[3],
                (String) r[4],
                (String) r[5],
                count(r[6]), count(r[7]),
                money(r[8]), money(r[9]), money(r[10]), money(r[11]), money(r[12]))).toList();

        List<PatientCategoryRow> byPatientCategory = queries.byPatientCategory(scope).stream()
                .map(r -> new PatientCategoryRow((PatientCategory) r[0], count(r[1]), money(r[2]), money(r[3]),
                        money(r[4]), money(r[5]))).toList();

        List<PayerRow> byPayer = queries.byPayer(scope).stream()
                .map(r -> new PayerRow((PayerType) r[0], (String) r[1], count(r[2]), money(r[3]), money(r[4]), money(r[5])))
                .toList();

        List<ReferrerRow> byReferrer = new ArrayList<>(queries.byReferrer(scope, TOP_REFERRERS).stream()
                .map(r -> new ReferrerRow((Long) r[0], (String) r[1], count(r[2]), money(r[3]), money(r[4]), money(r[5])))
                .toList());
        Object[] direct = queries.unreferred(scope);
        if (count(direct[0]) > 0) {
            byReferrer.add(new ReferrerRow(null, "Direct (no referring doctor)", count(direct[0]), money(direct[1]),
                    money(direct[2]), money(direct[3])));
        }

        List<PatientOutstandingRow> topPatients = queries.topOutstandingPatients(scope, TOP_PATIENTS).stream()
                .map(r -> new PatientOutstandingRow((Long) r[0], (String) r[1],
                        PatientPrivacy.displayName((String) r[2], Boolean.TRUE.equals(r[3])), count(r[4]), money(r[5])))
                .toList();

        return new Breakdown(
                Period.from(range),
                byTest,
                rollUp(byTest, t -> t.category() != null && !t.category().isBlank() ? t.category() : "Uncategorised"),
                rollUp(byTest, t -> t.department() != null ? t.department() : "Unassigned"),
                rollUp(byTest.stream().filter(t -> t.type() == TestType.PROFILE).toList(), TestRow::name),
                byPatientCategory,
                byPayer,
                byReferrer,
                topPatients);
    }

    /** Sums test rows into labelled groups; the groups therefore always reconcile exactly to the test table. */
    private static List<GroupRow> rollUp(List<TestRow> rows, Function<TestRow, String> label) {
        Map<String, BigDecimal[]> sums = new LinkedHashMap<>();
        Map<String, long[]> counts = new LinkedHashMap<>();
        for (TestRow t : rows) {
            String key = label.apply(t);
            BigDecimal[] m = sums.computeIfAbsent(key, k -> new BigDecimal[] {
                    BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO });
            long[] c = counts.computeIfAbsent(key, k -> new long[2]);
            m[0] = m[0].add(t.gross());
            m[1] = m[1].add(t.discount());
            m[2] = m[2].add(t.netBilled());
            m[3] = m[3].add(t.collected());
            m[4] = m[4].add(t.outstanding());
            c[0] += 1;
            c[1] += t.timesOrdered();
        }
        List<GroupRow> out = new ArrayList<>();
        sums.forEach((key, m) -> out.add(new GroupRow(key, counts.get(key)[0], counts.get(key)[1],
                m[0], m[1], m[2], m[3], m[4])));
        out.sort((a, b) -> b.netBilled().compareTo(a.netBilled()));
        return out;
    }

    // ----- trend ---------------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public Trend trend(Range range, Long branchId, Granularity granularity) {
        Scope scope = scope(range, branchId);
        Map<LocalDate, BigDecimal[]> byDay = new HashMap<>();
        for (Object[] r : queries.dailyTrend(scope, range.zoneOffsetLiteral())) {
            byDay.put(day(r[0]), new BigDecimal[] { money(r[1]), money(r[2]), money(r[3]) });
        }

        // Every bucket in the window is present, zero or not, so a chart never silently skips a quiet day.
        Map<LocalDate, BigDecimal[]> buckets = new LinkedHashMap<>();
        for (LocalDate d = range.from(); !d.isAfter(range.to()); d = d.plusDays(1)) {
            LocalDate key = bucketOf(d, granularity);
            BigDecimal[] acc = buckets.computeIfAbsent(key, k -> new BigDecimal[] { BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO });
            BigDecimal[] v = byDay.get(d);
            if (v != null) {
                acc[0] = acc[0].add(v[0]);
                acc[1] = acc[1].add(v[1]);
                acc[2] = acc[2].add(v[2]);
            }
        }
        List<TrendPoint> points = new ArrayList<>();
        buckets.forEach((k, v) -> points.add(new TrendPoint(k, v[0].setScale(2), v[1].setScale(2), v[2].setScale(2),
                v[1].subtract(v[2]).setScale(2))));
        return new Trend(Period.from(range), granularity, points);
    }

    private static LocalDate bucketOf(LocalDate d, Granularity g) {
        return switch (g) {
            case DAY -> d;
            case WEEK -> d.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
            case MONTH -> d.withDayOfMonth(1);
        };
    }

    /** The granularity that keeps a chart readable for a window of this length. */
    public static Granularity defaultGranularity(Range range) {
        long days = range.days();
        return days <= 92 ? Granularity.DAY : days <= 400 ? Granularity.WEEK : Granularity.MONTH;
    }

    // ----- registers -----------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public PageResponse<PaymentRow> payments(Range range, Long branchId, PaymentMethod method, String receivedBy,
                                             int page, int size, String sort, boolean descending) {
        Scope scope = scope(range, branchId);
        String orderBy = orderBy(RevenueQueries.PAYMENT_SORTS, sort, "receivedAt", descending);
        RevenueQueries.Page<Object[]> p = queries.payments(scope, method, blankToNull(receivedBy), orderBy, page, clamp(size));
        return pageOf(paymentRows(scope.orgId(), p.rows()), page, clamp(size), p.total());
    }

    private List<PaymentRow> paymentRows(Long orgId, List<Object[]> rows) {
        List<Long> ids = rows.stream().map(r -> ((Payment) r[0]).getId()).toList();
        Map<Long, BigDecimal> refunded = new HashMap<>();
        for (Object[] r : queries.refundedPerPayment(orgId, ids)) {
            refunded.put((Long) r[0], money(r[1]));
        }
        return rows.stream().map(r -> {
            Payment p = (Payment) r[0];
            return new PaymentRow(p.getId(), p.getReceivedAt(), (Long) r[1], (String) r[2],
                    (np.com.lims.billing.entity.InvoiceStatus) r[3],
                    (Long) r[4], (String) r[5], PatientPrivacy.displayName((String) r[6], Boolean.TRUE.equals(r[7])),
                    p.getMethod(), p.getAmount(), p.getReference(), p.getNote(), p.getReceivedBy(), p.isReversed(),
                    refunded.getOrDefault(p.getId(), BigDecimal.ZERO.setScale(2)));
        }).toList();
    }

    @Transactional(readOnly = true)
    public PageResponse<RefundRow> refunds(Range range, Long branchId, int page, int size, String sort, boolean descending) {
        Scope scope = scope(range, branchId);
        String orderBy = orderBy(RevenueQueries.REFUND_SORTS, sort, "decidedAt", descending);
        RevenueQueries.Page<Object[]> p = queries.refunds(scope, orderBy, page, clamp(size));
        return pageOf(refundRows(p.rows()), page, clamp(size), p.total());
    }

    private static List<RefundRow> refundRows(List<Object[]> rows) {
        return rows.stream().map(r -> {
            Refund f = (Refund) r[0];
            return new RefundRow(f.getId(), f.getDecidedAt(), f.getRequestedAt(), (Long) r[1], (String) r[2],
                    (Long) r[3], (String) r[4], PatientPrivacy.displayName((String) r[5], Boolean.TRUE.equals(r[6])),
                    f.getAmount(), f.getReason(), f.getRequestedBy(), f.getDecidedBy(), (PaymentMethod) r[7]);
        }).toList();
    }

    @Transactional(readOnly = true)
    public PageResponse<OutstandingRow> outstanding(Range range, Long branchId, OutstandingScope outstandingScope,
                                                    int page, int size, String sort, boolean descending) {
        Scope scope = scope(range, branchId);
        String orderBy = orderBy(RevenueQueries.OUTSTANDING_SORTS, sort, "balance", descending);
        RevenueQueries.Page<Object[]> p = queries.outstanding(scope, outstandingScope == OutstandingScope.PERIOD,
                orderBy, page, clamp(size));
        return pageOf(outstandingRows(p.rows()), page, clamp(size), p.total());
    }

    private static List<OutstandingRow> outstandingRows(List<Object[]> rows) {
        Instant now = Instant.now();
        return rows.stream().map(r -> {
            Instant issuedAt = (Instant) r[2];
            BigDecimal total = money(r[9]);
            BigDecimal netPaid = money(r[10]);
            return new OutstandingRow((Long) r[0], (String) r[1], issuedAt,
                    (Long) r[3], (String) r[4], PatientPrivacy.displayName((String) r[5], Boolean.TRUE.equals(r[6])),
                    (PayerType) r[7], (String) r[8], total, netPaid, money(r[11]), PaymentStatus.of(total, netPaid),
                    issuedAt == null ? 0 : Duration.between(issuedAt, now).toDays());
        }).toList();
    }

    // ----- the printable report ------------------------------------------------------------------

    /**
     * Everything the printed report needs in one response, produced by the same methods the
     * dashboard calls.
     *
     * <p>The audit entry for having read it is written by the controller, not here: this is the
     * one request that hands out every transaction and every open balance of the period at once,
     * so it is worth recording — but {@code AuditService} runs in its own transaction, and
     * starting one from inside this read-only transaction would have it contend with the very rows
     * being read.
     */
    @Transactional(readOnly = true)
    public Report report(Range range, Long branchId) {
        Scope scope = scope(range, branchId);
        Summary summary = summary(range, branchId);
        Breakdown breakdown = breakdown(range, branchId);
        Trend trend = trend(range, branchId, defaultGranularity(range));

        RevenueQueries.Page<Object[]> payments = queries.payments(scope, null, null,
                orderBy(RevenueQueries.PAYMENT_SORTS, "receivedAt", "receivedAt", false), 0, REGISTER_LIMIT);
        RevenueQueries.Page<Object[]> refunds = queries.refunds(scope,
                orderBy(RevenueQueries.REFUND_SORTS, "decidedAt", "decidedAt", false), 0, REGISTER_LIMIT);
        RevenueQueries.Page<Object[]> open = queries.outstanding(scope, true,
                orderBy(RevenueQueries.OUTSTANDING_SORTS, "issuedAt", "issuedAt", false), 0, REGISTER_LIMIT);

        return new Report(summary, breakdown, trend,
                register(paymentRows(scope.orgId(), payments.rows()), payments.total()),
                register(refundRows(refunds.rows()), refunds.total()),
                register(outstandingRows(open.rows()), open.total()));
    }

    private static <T> Register<T> register(List<T> rows, long total) {
        return new Register<>(rows, total, total > rows.size());
    }

    // ----- helpers -------------------------------------------------------------------------------

    /**
     * A branch-restricted user sees their branch whatever the request says, the same override the
     * invoice list applies; the tenant always comes from the authenticated request, so an
     * unscoped call fails rather than reading across clinics.
     *
     * <p>A referring-doctor login is refused outright. Every other list narrows itself to that
     * doctor's own referrals, but these are whole-laboratory figures: narrowing them would hand
     * back a number labelled "total collected" that is nothing of the sort, and not narrowing them
     * would disclose the laboratory's finances to an outside physician. No doctor role holds
     * REPORTING_READ today — this keeps that true if one is ever granted it by mistake.
     */
    private static Scope scope(Range range, Long requestedBranchId) {
        if (CurrentUser.doctorId() != null) {
            throw new ApiException(ErrorCode.ACCESS_DENIED,
                    "Revenue reports cover the whole laboratory and are not available to a referring-doctor login");
        }
        Long branchId = CurrentUser.branchId() != null ? CurrentUser.branchId() : requestedBranchId;
        return new Scope(TenantContext.require(), branchId, range.start(), range.endExclusive());
    }

    private static String orderBy(Map<String, String> allowed, String sort, String fallback, boolean descending) {
        String key = sort != null && allowed.containsKey(sort) ? sort : fallback;
        if (sort != null && !allowed.containsKey(sort)) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "Cannot sort by '" + sort + "'");
        }
        return allowed.get(key) + (descending ? " DESC" : " ASC");
    }

    private static int clamp(int size) {
        return Math.max(1, Math.min(size, MAX_PAGE_SIZE));
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    private static <T> PageResponse<T> pageOf(List<T> content, int page, int size, long total) {
        int totalPages = (int) Math.max(1, (total + size - 1) / size);
        return new PageResponse<>(content, page, size, total, totalPages, page == 0, page >= totalPages - 1);
    }
}
