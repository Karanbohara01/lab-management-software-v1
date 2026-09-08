package np.com.lims.dashboard;

import np.com.lims.billing.InvoiceRepository;
import np.com.lims.inventory.InventoryItemService;
import np.com.lims.ird.IrdSubmissionRepository;
import np.com.lims.ird.entity.IrdStatus;
import np.com.lims.order.LabOrderRepository;
import np.com.lims.patient.PatientRepository;
import np.com.lims.report.ReportRepository;
import np.com.lims.result.TestResultRepository;
import np.com.lims.result.entity.ResultStatus;
import np.com.lims.sample.SampleRepository;
import np.com.lims.sample.entity.SampleStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;

@RestController
@RequestMapping("/dashboard")
public class DashboardController {

    private final PatientRepository patientRepository;
    private final LabOrderRepository orderRepository;
    private final SampleRepository sampleRepository;
    private final TestResultRepository resultRepository;
    private final ReportRepository reportRepository;
    private final InvoiceRepository invoiceRepository;
    private final IrdSubmissionRepository irdRepository;
    private final InventoryItemService inventoryItemService;

    public DashboardController(PatientRepository patientRepository,
                              LabOrderRepository orderRepository,
                              SampleRepository sampleRepository,
                              TestResultRepository resultRepository,
                              ReportRepository reportRepository,
                              InvoiceRepository invoiceRepository,
                              IrdSubmissionRepository irdRepository,
                              InventoryItemService inventoryItemService) {
        this.patientRepository = patientRepository;
        this.orderRepository = orderRepository;
        this.sampleRepository = sampleRepository;
        this.resultRepository = resultRepository;
        this.reportRepository = reportRepository;
        this.invoiceRepository = invoiceRepository;
        this.irdRepository = irdRepository;
        this.inventoryItemService = inventoryItemService;
    }

    public record Summary(
            long todayPatients,
            long todayOrders,
            long pendingCollection,
            long samplesInLab,
            long resultsPendingEntry,
            long resultsPendingVerification,
            long resultsPendingApproval,
            long unresolvedCriticalResults,
            long reportsToday,
            BigDecimal todayRevenue,
            BigDecimal outstandingBalance,
            long failedIrdSubmissions,
            long inventoryAlerts
    ) {
    }

    @GetMapping("/summary")
    @PreAuthorize("isAuthenticated()")
    @Transactional(readOnly = true)
    public Summary summary() {
        var startOfToday = LocalDate.now().atStartOfDay(ZoneId.systemDefault()).toInstant();
        long inventoryAlerts = inventoryItemService.summary().alerts().size();

        return new Summary(
                patientRepository.countByCreatedAtGreaterThanEqual(startOfToday),
                orderRepository.countByOrderedAtGreaterThanEqual(startOfToday),
                sampleRepository.countByStatus(SampleStatus.AWAITING_COLLECTION),
                sampleRepository.countByStatus(SampleStatus.RECEIVED),
                resultRepository.countByStatus(ResultStatus.PENDING),
                resultRepository.countByStatus(ResultStatus.ENTERED),
                resultRepository.countByStatus(ResultStatus.VERIFIED),
                resultRepository.countByHasCriticalTrueAndStatusNot(ResultStatus.APPROVED),
                reportRepository.countByGeneratedAtGreaterThanEqual(startOfToday),
                invoiceRepository.revenueSince(startOfToday),
                invoiceRepository.totalOutstanding(),
                irdRepository.countByStatus(IrdStatus.FAILED),
                inventoryAlerts
        );
    }
}
