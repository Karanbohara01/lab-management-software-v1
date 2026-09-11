package np.com.lims.report;

import np.com.lims.catalog.LabTestRepository;
import np.com.lims.catalog.entity.LabTest;
import np.com.lims.common.audit.AuditService;
import np.com.lims.common.exception.ApiException;
import np.com.lims.common.web.CurrentUser;
import np.com.lims.common.exception.ErrorCode;
import np.com.lims.common.sequence.SequenceService;
import np.com.lims.messaging.PatientMessagingService;
import np.com.lims.order.LabOrderRepository;
import np.com.lims.order.entity.LabOrder;
import np.com.lims.order.entity.OrderStatus;
import np.com.lims.report.dto.ReportDtos.Detail;
import np.com.lims.report.dto.ReportDtos.ListItem;
import np.com.lims.report.dto.ReportDtos.VerificationResult;
import np.com.lims.report.entity.Report;
import np.com.lims.report.entity.ReportStatus;
import np.com.lims.report.entity.ReportType;
import np.com.lims.report.entity.ReportTest;
import np.com.lims.result.TestResultRepository;
import np.com.lims.result.entity.ResultStatus;
import np.com.lims.result.entity.ResultValue;
import np.com.lims.result.entity.TestResult;
import np.com.lims.settings.LaboratoryProfileService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class ReportService {

    private static final String MODULE = "REPORT";
    private static final String REPORT_SEQUENCE = "REPORT_NUMBER";

    private final ReportRepository reportRepository;
    private final LabOrderRepository orderRepository;
    private final TestResultRepository resultRepository;
    private final LabTestRepository testRepository;
    private final LaboratoryProfileService laboratoryProfileService;
    private final SequenceService sequenceService;
    private final AuditService auditService;
    private final PatientMessagingService messagingService;

    public ReportService(ReportRepository reportRepository,
                         LabOrderRepository orderRepository,
                         TestResultRepository resultRepository,
                         LabTestRepository testRepository,
                         LaboratoryProfileService laboratoryProfileService,
                         SequenceService sequenceService,
                         AuditService auditService,
                         PatientMessagingService messagingService) {
        this.reportRepository = reportRepository;
        this.orderRepository = orderRepository;
        this.resultRepository = resultRepository;
        this.testRepository = testRepository;
        this.laboratoryProfileService = laboratoryProfileService;
        this.messagingService = messagingService;
        this.sequenceService = sequenceService;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public Page<ListItem> search(ReportStatus status, Long patientId, String query, Pageable pageable) {
        String normalized = StringUtils.hasText(query) ? query.trim() : null;
        return reportRepository.search(status, patientId, normalized, pageable).map(ListItem::from);
    }

    @Transactional(readOnly = true)
    public Detail get(Long id) {
        Report report = reportRepository.findDetailedById(id)
                .orElseThrow(() -> ApiException.notFound("Report", id));
        return Detail.from(report, laboratoryProfileService.require());
    }

    @Transactional(readOnly = true)
    public Detail getByOrder(Long orderId) {
        Report report = reportRepository.findByOrderId(orderId)
                .orElseThrow(() -> ApiException.notFound("Report for order", orderId));
        return Detail.from(report, laboratoryProfileService.require());
    }

    @Transactional
    public Detail generate(Long orderId, boolean preliminary) {
        LabOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> ApiException.notFound("Order", orderId));
        if (order.getStatus() != OrderStatus.CONFIRMED) {
            throw ApiException.conflict("Reports can only be generated for confirmed orders");
        }

        List<TestResult> approved = resultRepository
                .findByOrderIdAndStatusOrderByDepartmentNameAscIdAsc(orderId, ResultStatus.APPROVED);
        if (approved.isEmpty()) {
            throw ApiException.conflict("No approved results are available for this order yet");
        }
        int totalResults = resultRepository.findByOrderIdOrderByIdAsc(orderId).size();
        boolean partial = approved.size() < totalResults;
        if (partial && !preliminary) {
            throw ApiException.conflict((totalResults - approved.size())
                    + " of " + totalResults + " tests on this order are not yet approved. "
                    + "Generate a preliminary report, or wait for the remaining results.");
        }

        Map<Long, LabTest> testsById = testRepository
                .findAllById(approved.stream().map(TestResult::getTestId).distinct().toList())
                .stream().collect(Collectors.toMap(t -> t.getId(), Function.identity()));

        String actor = CurrentUser.username();
        Report report = reportRepository.findByOrderId(orderId).orElse(null);
        boolean fresh = report == null;
        if (fresh) {
            report = Report.open(sequenceService.nextFormatted(REPORT_SEQUENCE, "RPT", 6), order, actor);
        } else {
            report.beginRegeneration(actor);
        }
        report.markType(partial ? ReportType.PRELIMINARY : ReportType.FINAL);

        for (TestResult result : approved) {
            LabTest test = testsById.get(result.getTestId());
            ReportTest block = report.addTest(
                    result.getTestCode(), result.getTestName(), result.getDepartmentName(),
                    test == null ? null : test.getMethod(),
                    result.getSample().getSpecimenType().name(),
                    result.getSample().getAccessionNumber(),
                    blockComment(result), result.getVerifiedBy(), result.getApprovedBy(), result.getApprovedAt());
            int order2 = 1;
            for (ResultValue value : result.getValues()) {
                block.addParameter(value.getParameterName(), value.getParameterUnit(),
                        displayValue(value), value.getFlag(), value.getReferenceText(), order2++, value.getComment());
            }
        }

        Report saved = fresh ? reportRepository.save(report) : report;
        auditService.record(MODULE, fresh ? "GENERATE" : "REGENERATE", "Report", saved.getId(),
                (fresh ? "Generated" : "Regenerated (v" + saved.getReportVersion() + ")")
                        + " report " + saved.getReportNumber() + " covering " + approved.size() + " test(s)",
                null, null);
        return Detail.from(saved, laboratoryProfileService.require());
    }

    @Transactional
    public Detail release(Long id, String signerCredentials) {
        Report report = load(id);
        report.sign(CurrentUser.username(), StringUtils.hasText(signerCredentials) ? signerCredentials.trim() : null,
                contentHash(report), newToken());
        report.release(CurrentUser.username());
        auditService.record(MODULE, "RELEASE", "Report", id,
                "Released " + report.getReportType() + " report " + report.getReportNumber()
                        + " (signed by " + CurrentUser.username() + ")", null, null);
        return Detail.from(report, laboratoryProfileService.require());
    }

    @Transactional(readOnly = true)
    public VerificationResult verify(String token) {
        return reportRepository.findByVerificationToken(token).map(r -> new VerificationResult(
                true, r.getReportNumber(), r.getReportVersion(), r.getReportType().name(), r.getStatus().name(),
                r.getPatient().getMrn(), r.getGeneratedAt(), r.getReleasedAt(),
                r.getSignedBy(), r.getSignerCredentials(), r.getSignedAt(), r.getContentHash()))
                .orElseGet(VerificationResult::notFound);
    }

    private static String newToken() {
        byte[] b = new byte[16];
        new java.security.SecureRandom().nextBytes(b);
        StringBuilder sb = new StringBuilder();
        for (byte x : b) sb.append(String.format("%02x", x));
        return sb.toString();
    }

    private static String contentHash(Report report) {
        StringBuilder sb = new StringBuilder(report.getReportNumber()).append('|')
                .append(report.getReportVersion()).append('|').append(report.getReportType()).append('|')
                .append(report.getPatient().getMrn()).append('|');
        report.getTests().forEach(t -> {
            sb.append(t.getTestCode()).append(':');
            t.getParameters().forEach(p -> sb.append(p.getName()).append('=')
                    .append(p.getValueDisplay()).append('/').append(p.getFlag()).append(';'));
        });
        try {
            byte[] d = java.security.MessageDigest.getInstance("SHA-256")
                    .digest(sb.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte x : d) hex.append(String.format("%02x", x));
            return hex.toString();
        } catch (java.security.NoSuchAlgorithmException e) {
            return null;
        }
    }

    @Transactional
    public Detail markDelivered(Long id, String method, String recipient) {
        Report report = load(id);
        String normalizedMethod = method.trim();
        String finalRecipient = StringUtils.hasText(recipient) ? recipient.trim() : null;

        if (PatientMessagingService.isMessagingChannel(normalizedMethod)) {
            if (finalRecipient == null) {
                finalRecipient = report.getPatient().getPhone();
            }
            if (!StringUtils.hasText(finalRecipient)) {
                throw new ApiException(ErrorCode.VALIDATION_FAILED,
                        "This patient has no phone number on file — enter one to send via " + normalizedMethod + ".");
            }
            var result = messagingService.sendReportReady(normalizedMethod, finalRecipient,
                    laboratoryProfileService.require().getName(), report.getPatient().getFullName(),
                    report.getReportNumber(), report.getVerificationToken());
            if (!result.sent()) {
                auditService.record(MODULE, "DELIVER_FAILED", "Report", id,
                        "Failed to deliver report " + report.getReportNumber() + " via " + normalizedMethod
                                + " to " + finalRecipient + " — " + result.errorMessage(), null, null);
                throw new ApiException(ErrorCode.EXTERNAL_SERVICE_UNAVAILABLE, result.errorMessage());
            }
            report.markDelivered(CurrentUser.username(), normalizedMethod, finalRecipient);
            auditService.record(MODULE, "DELIVER", "Report", id,
                    "Delivered report " + report.getReportNumber() + " via " + normalizedMethod + " to "
                            + finalRecipient
                            + (result.providerReference() != null ? " (ref " + result.providerReference() + ")" : ""),
                    null, null);
            return Detail.from(report, laboratoryProfileService.require());
        }

        report.markDelivered(CurrentUser.username(), normalizedMethod, finalRecipient);
        auditService.record(MODULE, "DELIVER", "Report", id,
                "Delivered report " + report.getReportNumber() + " via " + normalizedMethod, null, null);
        return Detail.from(report, laboratoryProfileService.require());
    }

    private Report load(Long id) {
        return reportRepository.findDetailedById(id).orElseThrow(() -> ApiException.notFound("Report", id));
    }

    /** Report block comment = culture findings (if any), then specimen-condition note, then the comment. */
    private static String blockComment(TestResult result) {
        String condition = result.getSample() == null || result.getSample().getCondition() == null
                ? "" : result.getSample().getCondition().summary();
        String comment = result.getComment() == null ? "" : result.getComment().trim();
        java.util.List<String> parts = new java.util.ArrayList<>();
        String culture = cultureNarrative(result);
        if (!culture.isBlank()) {
            parts.add(culture);
        }
        if (!condition.isBlank()) {
            parts.add("Specimen: " + condition + ".");
        }
        if (!comment.isBlank()) {
            parts.add(comment);
        }
        return parts.isEmpty() ? null : String.join("\n", parts);
    }

    /** Plain-text rendering of a culture & sensitivity result for the report block. */
    private static String cultureNarrative(TestResult result) {
        if (result.getCultureGrowth() == null) {
            return "";
        }
        StringBuilder sb = new StringBuilder("CULTURE: ").append(result.getCultureGrowth().description()).append('.');
        for (np.com.lims.result.entity.CultureIsolate iso : result.getCultureIsolates()) {
            sb.append("\n  ").append(iso.getSequenceNo()).append(". ").append(iso.getOrganismName());
            if (StringUtils.hasText(iso.getColonyCount())) {
                sb.append(" — ").append(iso.getColonyCount());
            }
            String sensitive = susceptibilityNames(iso, np.com.lims.result.entity.Susceptibility.S);
            String intermediate = susceptibilityNames(iso, np.com.lims.result.entity.Susceptibility.I);
            String resistant = susceptibilityNames(iso, np.com.lims.result.entity.Susceptibility.R);
            if (!sensitive.isBlank()) {
                sb.append("\n     Sensitive: ").append(sensitive);
            }
            if (!intermediate.isBlank()) {
                sb.append("\n     Intermediate: ").append(intermediate);
            }
            if (!resistant.isBlank()) {
                sb.append("\n     Resistant: ").append(resistant);
            }
        }
        return sb.toString();
    }

    private static String susceptibilityNames(np.com.lims.result.entity.CultureIsolate iso,
                                              np.com.lims.result.entity.Susceptibility interpretation) {
        return iso.getSusceptibilities().stream()
                .filter(s -> s.getInterpretation() == interpretation)
                .map(np.com.lims.result.entity.CultureSusceptibility::getAntibioticName)
                .collect(java.util.stream.Collectors.joining(", "));
    }

    private static String displayValue(ResultValue value) {
        BigDecimal numeric = value.getValueNumeric();
        if (numeric != null) {
            return numeric.stripTrailingZeros().toPlainString();
        }
        return StringUtils.hasText(value.getValueText()) ? value.getValueText() : "—";
    }
}
