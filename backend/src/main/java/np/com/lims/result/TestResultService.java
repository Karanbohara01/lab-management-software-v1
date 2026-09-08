package np.com.lims.result;

import np.com.lims.catalog.LabTestRepository;
import np.com.lims.catalog.entity.LabTest;
import np.com.lims.catalog.entity.ParameterDataType;
import np.com.lims.catalog.entity.TestParameter;
import np.com.lims.common.audit.AuditService;
import np.com.lims.common.exception.ApiException;
import np.com.lims.common.web.CurrentUser;
import np.com.lims.notification.NotificationService;
import np.com.lims.notification.entity.Notification;
import np.com.lims.patient.entity.Patient;
import np.com.lims.qc.QcService;
import np.com.lims.result.dto.ResultDtos.AmendRequest;
import np.com.lims.result.dto.ResultDtos.ApproveRequest;
import np.com.lims.result.dto.ResultDtos.CallbackDto;
import np.com.lims.result.dto.ResultDtos.CriticalCallbackRequest;
import np.com.lims.result.dto.ResultDtos.Detail;
import np.com.lims.result.dto.ResultDtos.ListItem;
import np.com.lims.result.dto.ResultDtos.SaveValuesRequest;
import np.com.lims.result.dto.ResultDtos.Summary;
import np.com.lims.result.dto.ResultDtos.ValueInput;
import np.com.lims.result.entity.CriticalValueCallback;
import np.com.lims.result.entity.ResultFlag;
import np.com.lims.result.entity.ResultStatus;
import np.com.lims.result.entity.ResultValue;
import np.com.lims.result.entity.TestResult;
import np.com.lims.sample.entity.Sample;
import np.com.lims.sample.entity.SampleItem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

@Service
public class TestResultService {

    private static final String MODULE = "RESULT";

    private final TestResultRepository resultRepository;
    private final CriticalValueCallbackRepository callbackRepository;
    private final QcService qcService;
    private final LabTestRepository labTestRepository;
    private final ReferenceRangeResolver rangeResolver;
    private final AuditService auditService;
    private final NotificationService notificationService;

    public TestResultService(TestResultRepository resultRepository,
                             CriticalValueCallbackRepository callbackRepository,
                             QcService qcService,
                             LabTestRepository labTestRepository,
                             ReferenceRangeResolver rangeResolver,
                             AuditService auditService,
                             NotificationService notificationService) {
        this.resultRepository = resultRepository;
        this.callbackRepository = callbackRepository;
        this.qcService = qcService;
        this.labTestRepository = labTestRepository;
        this.rangeResolver = rangeResolver;
        this.auditService = auditService;
        this.notificationService = notificationService;
    }

    /** Creates a pending result (with an empty value per parameter) for every test on a received sample. */
    @Transactional
    public void generateForSample(Sample sample) {
        if (resultRepository.existsBySampleId(sample.getId())) {
            return;
        }
        for (SampleItem item : sample.getItems()) {
            TestResult result = TestResult.create(item, item.getTest().getTurnaroundHours());
            for (TestParameter parameter : item.getTest().getParameters()) {
                result.addParameterSlot(parameter);
            }
            resultRepository.save(result);
        }
        auditService.record(MODULE, "GENERATE", "Sample", sample.getId(),
                "Opened result worklist for sample " + sample.getAccessionNumber(), null, null);
    }

    @Transactional(readOnly = true)
    public Page<ListItem> search(ResultStatus status, Long departmentId, Long sampleId, Long orderId,
                                 Long patientId, boolean criticalOnly, boolean overdueOnly, boolean criticalPendingOnly,
                                 String query, Pageable pageable) {
        String normalized = StringUtils.hasText(query) ? query.trim() : null;
        return resultRepository.search(status, departmentId, sampleId, orderId, patientId, criticalOnly, overdueOnly,
                criticalPendingOnly, normalized, pageable).map(ListItem::from);
    }

    @Transactional(readOnly = true)
    public List<ListItem> forOrder(Long orderId) {
        return resultRepository.findByOrderIdOrderByIdAsc(orderId).stream().map(ListItem::from).toList();
    }

    @Transactional(readOnly = true)
    public Detail get(Long id) {
        return detail(load(id));
    }

    private List<CallbackDto> callbacksOf(Long resultId) {
        return callbackRepository.findByResultIdOrderByNotifiedAtDesc(resultId).stream()
                .map(CallbackDto::from).toList();
    }

    /** Detail with critical callbacks and, for not-yet-entered values, the configured reference-range text. */
    private Detail detail(TestResult result) {
        return Detail.from(result, callbacksOf(result.getId()), referenceHints(result));
    }

    private Map<Long, String> referenceHints(TestResult result) {
        Patient patient = result.getPatient();
        Integer ageYears = patient.ageYears();
        Integer ageDays = patient.ageInDays();
        Map<Long, String> hints = new java.util.HashMap<>();
        for (ResultValue v : result.getValues()) {
            TestParameter param = v.getParameter();
            var interp = rangeResolver.interpret(param, patient.getGender(), ageYears, ageDays,
                    v.getDataType(), null, null);
            if (interp.referenceText() != null) {
                hints.put(param.getId(), interp.referenceText());
            }
        }
        return hints;
    }

    @Transactional
    public Detail logCriticalCallback(Long id, CriticalCallbackRequest req) {
        TestResult result = load(id);
        callbackRepository.save(CriticalValueCallback.logged(result, req.notifiedName().trim(),
                trimToNull(req.notifiedRole()), req.contactMethod(), req.readBackConfirmed(),
                trimToNull(req.remarks())));
        result.clearCriticalAck();
        audit(result, "CRITICAL_CALLBACK", "Critical value of " + result.getTestCode()
                + " notified to " + req.notifiedName().trim()
                + (req.readBackConfirmed() ? " (read-back confirmed)" : ""));
        return detail(result);
    }

    @Transactional
    public Detail waiveCriticalCallback(Long id, String reason) {
        TestResult result = load(id);
        callbackRepository.save(CriticalValueCallback.waivedFor(result, reason.trim()));
        result.clearCriticalAck();
        audit(result, "CRITICAL_CALLBACK_WAIVED", "Critical-value callback for " + result.getTestCode()
                + " waived: " + reason.trim());
        return detail(result);
    }

    @Transactional(readOnly = true)
    public Summary summary(Long departmentId) {
        Map<String, Long> counts = new TreeMap<>();
        for (ResultStatus status : ResultStatus.values()) {
            counts.put(status.name(), 0L);
        }
        resultRepository.countByStatus(departmentId).forEach(row -> counts.put(row.getStatus().name(), row.getCount()));
        counts.put("OVERDUE", resultRepository.countOverdue(departmentId));
        counts.put("CRITICAL_PENDING", resultRepository.countCriticalPending(departmentId));
        return new Summary(counts);
    }

    @Transactional
    public Detail saveValues(Long id, SaveValuesRequest request) {
        TestResult result = load(id);
        if (!result.getStatus().isValueEditable()) {
            throw ApiException.invalidTransition("Result is " + result.getStatus() + " and can no longer be edited");
        }
        String actor = CurrentUser.username();
        applyValues(result, request.values(), actor, null);
        if (request.comment() != null) {
            result.setComment(trimToNull(request.comment()));
        }
        result.markEntered(actor);
        result.recomputeAbnormalFlags();
        audit(result, "ENTER", "Entered results for " + result.getTestCode());
        maybeAutoVerify(result);
        return detail(result);
    }

    @Transactional
    public Detail verify(Long id) {
        TestResult result = load(id);
        result.verify(CurrentUser.username());
        audit(result, "VERIFY", "Verified results for " + result.getTestCode());
        return detail(result);
    }

    @Transactional
    public Detail approve(Long id, ApproveRequest request) {
        TestResult result = load(id);
        if (qcService.isLocked(result.getTestId())
                && (request == null || request.qcOverrideReason() == null || request.qcOverrideReason().isBlank())) {
            throw new ApiException(np.com.lims.common.exception.ErrorCode.RESOURCE_CONFLICT,
                    "Internal QC for " + result.getTestCode() + " is out of control. "
                            + "Resolve the QC failure, or approve with a documented override reason.");
        }
        result.approve(CurrentUser.username());
        if (request != null && request.qcOverrideReason() != null && !request.qcOverrideReason().isBlank()) {
            audit(result, "QC_OVERRIDE", "Approved " + result.getTestCode()
                    + " despite out-of-control QC - reason: " + request.qcOverrideReason().trim());
        }
        audit(result, "APPROVE", "Approved results for " + result.getTestCode()
                + (result.isHasCritical() ? " (CRITICAL values present)" : ""));
        if (result.isHasCritical()) {
            notificationService.publish(Notification.Type.CRITICAL_RESULT, Notification.Severity.CRITICAL,
                    "Critical result approved",
                    result.getTestName() + " for " + result.getPatient().getFullName()
                            + " (" + result.getPatient().getMrn() + ") — follow the critical-value protocol",
                    "/results/" + result.getId(), "RESULT_READ", "result:" + result.getId());
        }
        return detail(result);
    }

    @Transactional
    public Detail reject(Long id, String reason) {
        TestResult result = load(id);
        result.sendBackForCorrection(CurrentUser.username(), reason.trim());
        audit(result, "REJECT", "Sent " + result.getTestCode() + " results back for correction – " + reason);
        return detail(result);
    }

    @Transactional
    public Detail amend(Long id, AmendRequest request) {
        TestResult result = load(id);
        if (result.getStatus() != ResultStatus.APPROVED) {
            throw ApiException.invalidTransition("Only approved results can be amended");
        }
        String actor = CurrentUser.username();
        applyValues(result, request.values(), actor, request.reason().trim());
        if (request.comment() != null) {
            result.setComment(trimToNull(request.comment()));
        }
        result.amend(actor);
        result.recomputeAbnormalFlags();
        audit(result, "AMEND", "Amended approved results for " + result.getTestCode() + " – " + request.reason());
        return detail(result);
    }

    // ----- value application ----------------------------------------

    /**
     * Writes the supplied values onto the result: validates plausibility and allowed values, rounds to
     * the parameter's decimal places, resolves each parameter's reference range and flag, then computes
     * any calculated (formula) parameters. A history entry is recorded whenever a value that already
     * held content changes, or on any change when an amendment reason is supplied.
     */
    private void applyValues(TestResult result, List<ValueInput> inputs, String actor, String amendReason) {
        Patient patient = result.getPatient();
        Integer ageYears = patient.ageYears();
        Integer ageDays = patient.ageInDays();
        Map<Long, ValueInput> byParameter = (inputs == null ? List.<ValueInput>of() : inputs).stream()
                .collect(java.util.stream.Collectors.toMap(ValueInput::parameterId, v -> v, (a, b) -> b));

        // 1. manually entered values
        for (ResultValue value : result.getValues()) {
            TestParameter param = value.getParameter();
            if (param.isCalculated()) {
                continue;
            }
            ValueInput input = byParameter.get(param.getId());
            if (input == null) {
                continue;
            }
            String oldDisplay = value.displayValue();
            BigDecimal numeric = null;
            String text = null;
            if (value.getDataType() == ParameterDataType.NUMERIC) {
                numeric = input.valueNumeric();
                if (numeric != null) {
                    assertPlausible(param, numeric);
                    numeric = round(param, numeric);
                }
            } else {
                text = trimToNull(input.valueText());
                assertAllowed(param, text);
            }
            var interp = rangeResolver.interpret(param, patient.getGender(), ageYears, ageDays,
                    value.getDataType(), numeric, text);
            value.setValue(numeric, text, interp.flag(), interp.referenceText());
            if (input.comment() != null) {
                value.setComment(trimToNull(input.comment()));
            }
            recordIfChanged(result, value, oldDisplay, amendReason, actor);
        }

        // 2. calculated (formula) values
        computeDerived(result, patient, ageYears, ageDays, amendReason, actor);

        // 3. delta checks against the patient's previous approved result
        applyDeltaChecks(result);
    }

    private void applyDeltaChecks(TestResult result) {
        for (ResultValue v : result.getValues()) {
            BigDecimal threshold = v.getParameter().getDeltaCheckPercent();
            if (threshold == null || v.getValueNumeric() == null) {
                v.clearDelta();
                continue;
            }
            List<BigDecimal> prev = resultRepository.previousNumericValues(
                    result.getPatient().getId(), result.getTestId(), v.getParameterName(), result.getId(),
                    org.springframework.data.domain.PageRequest.of(0, 1));
            if (prev.isEmpty() || prev.get(0).signum() == 0) {
                v.clearDelta();
                continue;
            }
            BigDecimal previous = prev.get(0);
            BigDecimal deltaPct = v.getValueNumeric().subtract(previous).abs()
                    .divide(previous.abs(), 6, java.math.RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .setScale(2, java.math.RoundingMode.HALF_UP);
            v.setDelta(previous, deltaPct, deltaPct.compareTo(threshold) > 0);
        }
    }

    /**
     * Verifies a result automatically when its test allows it and every value is normal, in range,
     * with no delta breach. Runs after ENTER; a technician still approves at the pathologist step.
     */
    private void maybeAutoVerify(TestResult result) {
        if (result.getStatus() != ResultStatus.ENTERED) {
            return;
        }
        LabTest test = labTestRepository.findById(result.getTestId()).orElse(null);
        if (test == null || !test.isAutoVerifyEnabled()) {
            return;
        }
        if (result.isHasAbnormal() || result.isHasCritical() || result.hasDeltaBreach()) {
            return;
        }
        boolean anyValue = result.getValues().stream().anyMatch(ResultValue::hasValue);
        boolean allNumericInterpreted = result.getValues().stream()
                .filter(v -> v.getDataType() == ParameterDataType.NUMERIC
                        && !v.getParameter().isCalculated() && v.hasValue())
                .allMatch(v -> v.getFlag() != ResultFlag.NONE);
        if (!anyValue || !allNumericInterpreted) {
            return;
        }
        result.verify("auto-verify");
        result.markAutoVerified();
        audit(result, "AUTO_VERIFY",
                "Auto-verified " + result.getTestCode() + " — all values normal and in range, no delta breach");
    }

    private void computeDerived(TestResult result, Patient patient, Integer ageYears, Integer ageDays,
                                String amendReason, String actor) {
        boolean anyCalculated = result.getValues().stream().anyMatch(v -> v.getParameter().isCalculated());
        if (!anyCalculated) {
            return;
        }
        Map<String, BigDecimal> vars = new java.util.HashMap<>();
        for (ResultValue v : result.getValues()) {
            if (v.getParameter().getCode() != null && v.getValueNumeric() != null) {
                vars.put(v.getParameter().getCode(), v.getValueNumeric());
            }
        }
        if (ageYears != null) vars.put("age", BigDecimal.valueOf(ageYears));
        if (ageDays != null) vars.put("ageDays", BigDecimal.valueOf(ageDays));
        var gender = patient.getGender();
        vars.put("sexM", BigDecimal.valueOf(gender == np.com.lims.patient.entity.Gender.MALE ? 1 : 0));
        vars.put("sexF", BigDecimal.valueOf(gender == np.com.lims.patient.entity.Gender.FEMALE ? 1 : 0));

        Map<Long, String> oldDisplays = new java.util.HashMap<>();
        result.getValues().stream().filter(v -> v.getParameter().isCalculated())
                .forEach(v -> oldDisplays.put(v.getParameter().getId(), v.displayValue()));

        for (int pass = 0; pass < 4; pass++) {
            boolean changed = false;
            for (ResultValue v : result.getValues()) {
                TestParameter p = v.getParameter();
                if (!p.isCalculated()) {
                    continue;
                }
                BigDecimal computed = np.com.lims.common.formula.FormulaEvaluator
                        .evaluate(p.getCalculationFormula(), vars);
                if (computed != null) {
                    computed = round(p, computed);
                }
                var interp = rangeResolver.interpret(p, gender, ageYears, ageDays,
                        ParameterDataType.NUMERIC, computed, null);
                v.setValue(computed, null, interp.flag(), interp.referenceText());
                if (p.getCode() != null) {
                    BigDecimal prev = vars.put(p.getCode(), computed);
                    if (!java.util.Objects.equals(prev, computed)) {
                        changed = true;
                    }
                }
            }
            if (!changed) {
                break;
            }
        }

        for (ResultValue v : result.getValues()) {
            if (v.getParameter().isCalculated()) {
                recordIfChanged(result, v, oldDisplays.get(v.getParameter().getId()), amendReason, actor);
            }
        }
    }

    private void recordIfChanged(TestResult result, ResultValue value, String oldDisplay,
                                 String amendReason, String actor) {
        String newDisplay = value.displayValue();
        boolean changed = !java.util.Objects.equals(oldDisplay, newDisplay);
        if (changed && (oldDisplay != null || amendReason != null)) {
            result.recordChange(value.getParameterName(), oldDisplay, newDisplay, amendReason, actor);
        }
    }

    private static BigDecimal round(TestParameter param, BigDecimal value) {
        if (value == null || param.getDecimalPlaces() == null) {
            return value;
        }
        return value.setScale(param.getDecimalPlaces(), java.math.RoundingMode.HALF_UP);
    }

    private static void assertPlausible(TestParameter param, BigDecimal value) {
        boolean tooLow = param.getAbsurdLow() != null && value.compareTo(param.getAbsurdLow()) < 0;
        boolean tooHigh = param.getAbsurdHigh() != null && value.compareTo(param.getAbsurdHigh()) > 0;
        if (tooLow || tooHigh) {
            throw new ApiException(np.com.lims.common.exception.ErrorCode.VALIDATION_FAILED,
                    param.getName() + ": " + value.stripTrailingZeros().toPlainString()
                            + " is outside the plausible range for this parameter. Re-check the entry.");
        }
    }

    private static void assertAllowed(TestParameter param, String text) {
        if (text == null) {
            return;
        }
        List<String> allowed = param.allowedValueList();
        if (!allowed.isEmpty() && allowed.stream().noneMatch(a -> a.equalsIgnoreCase(text))) {
            throw new ApiException(np.com.lims.common.exception.ErrorCode.VALIDATION_FAILED,
                    param.getName() + ": \"" + text + "\" is not an allowed value (" + String.join(", ", allowed) + ").");
        }
    }

    private void audit(TestResult result, String action, String summary) {
        auditService.record(MODULE, action, "TestResult", result.getId(), summary, null, Detail.from(result));
    }

    private TestResult load(Long id) {
        return resultRepository.findDetailedById(id).orElseThrow(() -> ApiException.notFound("Result", id));
    }

    private static String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
