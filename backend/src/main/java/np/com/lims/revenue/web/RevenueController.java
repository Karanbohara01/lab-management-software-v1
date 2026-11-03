package np.com.lims.revenue.web;

import np.com.lims.billing.entity.PaymentMethod;
import np.com.lims.common.api.PageResponse;
import np.com.lims.common.audit.AuditService;
import np.com.lims.revenue.RevenueDtos.Breakdown;
import np.com.lims.revenue.RevenueDtos.Granularity;
import np.com.lims.revenue.RevenueDtos.OutstandingRow;
import np.com.lims.revenue.RevenueDtos.OutstandingScope;
import np.com.lims.revenue.RevenueDtos.PaymentRow;
import np.com.lims.revenue.RevenueDtos.RefundRow;
import np.com.lims.revenue.RevenueDtos.Report;
import np.com.lims.revenue.RevenueDtos.Summary;
import np.com.lims.revenue.RevenueDtos.Trend;
import np.com.lims.revenue.RevenuePeriod;
import np.com.lims.revenue.RevenuePeriod.Preset;
import np.com.lims.revenue.RevenuePeriod.Range;
import np.com.lims.revenue.RevenueService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

/**
 * Revenue management and reporting. Every endpoint takes the same window — either a
 * {@code preset} resolved on the laboratory's calendar, or an explicit inclusive {@code from}/{@code to}
 * — and {@code branchId}, which a branch-restricted user cannot widen.
 *
 * <p>Guarded by {@code REPORTING_READ}, the existing "analytics and management reports" permission:
 * held by administrators, accountants and pathologists; not by technicians, reception or
 * collection staff.
 */
@RestController
@RequestMapping("/revenue")
public class RevenueController {

    private final RevenueService service;
    private final AuditService auditService;

    public RevenueController(RevenueService service, AuditService auditService) {
        this.service = service;
        this.auditService = auditService;
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAuthority('PERM_REPORTING_READ')")
    public Summary summary(@RequestParam(required = false) Preset preset,
                           @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                           @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
                           @RequestParam(required = false) Long branchId) {
        return service.summary(RevenuePeriod.resolve(preset, from, to), branchId);
    }

    @GetMapping("/breakdown")
    @PreAuthorize("hasAuthority('PERM_REPORTING_READ')")
    public Breakdown breakdown(@RequestParam(required = false) Preset preset,
                               @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                               @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
                               @RequestParam(required = false) Long branchId) {
        return service.breakdown(RevenuePeriod.resolve(preset, from, to), branchId);
    }

    @GetMapping("/trend")
    @PreAuthorize("hasAuthority('PERM_REPORTING_READ')")
    public Trend trend(@RequestParam(required = false) Preset preset,
                       @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                       @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
                       @RequestParam(required = false) Long branchId,
                       @RequestParam(required = false) Granularity granularity) {
        Range range = RevenuePeriod.resolve(preset, from, to);
        return service.trend(range, branchId, granularity != null ? granularity : RevenueService.defaultGranularity(range));
    }

    @GetMapping("/payments")
    @PreAuthorize("hasAuthority('PERM_REPORTING_READ')")
    public PageResponse<PaymentRow> payments(@RequestParam(required = false) Preset preset,
                                             @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                             @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
                                             @RequestParam(required = false) Long branchId,
                                             @RequestParam(required = false) PaymentMethod method,
                                             @RequestParam(required = false) String receivedBy,
                                             @RequestParam(defaultValue = "0") int page,
                                             @RequestParam(defaultValue = "20") int size,
                                             @RequestParam(required = false) String sort,
                                             @RequestParam(defaultValue = "desc") String dir) {
        return service.payments(RevenuePeriod.resolve(preset, from, to), branchId, method, receivedBy,
                Math.max(0, page), size, sort, !"asc".equalsIgnoreCase(dir));
    }

    @GetMapping("/refunds")
    @PreAuthorize("hasAuthority('PERM_REPORTING_READ')")
    public PageResponse<RefundRow> refunds(@RequestParam(required = false) Preset preset,
                                           @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                           @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
                                           @RequestParam(required = false) Long branchId,
                                           @RequestParam(defaultValue = "0") int page,
                                           @RequestParam(defaultValue = "20") int size,
                                           @RequestParam(required = false) String sort,
                                           @RequestParam(defaultValue = "desc") String dir) {
        return service.refunds(RevenuePeriod.resolve(preset, from, to), branchId, Math.max(0, page), size, sort,
                !"asc".equalsIgnoreCase(dir));
    }

    @GetMapping("/outstanding")
    @PreAuthorize("hasAuthority('PERM_REPORTING_READ')")
    public PageResponse<OutstandingRow> outstanding(@RequestParam(required = false) Preset preset,
                                                    @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                                    @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
                                                    @RequestParam(required = false) Long branchId,
                                                    @RequestParam(defaultValue = "PERIOD") OutstandingScope scope,
                                                    @RequestParam(defaultValue = "0") int page,
                                                    @RequestParam(defaultValue = "20") int size,
                                                    @RequestParam(required = false) String sort,
                                                    @RequestParam(defaultValue = "desc") String dir) {
        return service.outstanding(RevenuePeriod.resolve(preset, from, to), branchId, scope, Math.max(0, page), size,
                sort, !"asc".equalsIgnoreCase(dir));
    }

    /**
     * The complete printable report — summary, breakdowns, trend and all three registers — in one
     * response. Recorded in the audit log: unlike the dashboard's aggregates, this discloses every
     * receipt, every refund and every open balance of the period in one go.
     */
    @GetMapping("/report")
    @PreAuthorize("hasAuthority('PERM_REPORTING_READ')")
    public Report report(@RequestParam(required = false) Preset preset,
                         @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                         @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
                         @RequestParam(required = false) Long branchId) {
        Range range = RevenuePeriod.resolve(preset, from, to);
        Report report = service.report(range, branchId);
        auditService.record("REVENUE", "REPORT", "RevenueReport", null,
                "Generated revenue report for " + range.from() + " to " + range.to()
                        + (branchId != null ? " (branch " + branchId + ")" : " (all branches)"), null, null);
        return report;
    }
}
