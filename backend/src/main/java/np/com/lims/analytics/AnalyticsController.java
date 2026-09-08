package np.com.lims.analytics;

import np.com.lims.billing.InvoiceRepository;
import np.com.lims.order.LabOrderRepository;
import np.com.lims.result.TestResultRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/analytics")
public class AnalyticsController {

    private final InvoiceRepository invoiceRepository;
    private final TestResultRepository resultRepository;
    private final LabOrderRepository orderRepository;

    public AnalyticsController(InvoiceRepository invoiceRepository,
                               TestResultRepository resultRepository,
                               LabOrderRepository orderRepository) {
        this.invoiceRepository = invoiceRepository;
        this.resultRepository = resultRepository;
        this.orderRepository = orderRepository;
    }

    public record Point(String label, BigDecimal value) {
    }

    public record Overview(int days,
                           List<Point> revenueByDay,
                           List<Point> testsByDepartment,
                           List<Point> topTests,
                           List<Point> topReferrers) {
    }

    @GetMapping("/overview")
    @PreAuthorize("hasAuthority('PERM_REPORTING_READ')")
    @Transactional(readOnly = true)
    public Overview overview(@RequestParam(defaultValue = "30") int days) {
        int window = Math.min(Math.max(days, 7), 180);
        LocalDate today = LocalDate.now();
        var from = today.minusDays(window - 1L).atStartOfDay(ZoneId.systemDefault()).toInstant();

        Map<String, BigDecimal> revenueByDate = new HashMap<>();
        for (Object[] row : invoiceRepository.dailyRevenue(from)) {
            revenueByDate.put(String.valueOf(row[0]), toBigDecimal(row[1]));
        }
        List<Point> revenueByDay = new ArrayList<>();
        for (int i = 0; i < window; i++) {
            LocalDate d = today.minusDays(window - 1L - i);
            revenueByDay.add(new Point(d.toString(), revenueByDate.getOrDefault(d.toString(), BigDecimal.ZERO)));
        }

        return new Overview(window,
                revenueByDay,
                toPoints(resultRepository.countByDepartmentSince(from)),
                toPoints(resultRepository.topTestsSince(from, PageRequest.of(0, 8))),
                toPoints(orderRepository.topReferrersSince(from, PageRequest.of(0, 8))));
    }

    private static List<Point> toPoints(List<Object[]> rows) {
        List<Point> points = new ArrayList<>();
        for (Object[] row : rows) {
            points.add(new Point(String.valueOf(row[0]), toBigDecimal(row[1])));
        }
        return points;
    }

    private static BigDecimal toBigDecimal(Object value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        return value instanceof BigDecimal bd ? bd : new BigDecimal(value.toString());
    }
}
