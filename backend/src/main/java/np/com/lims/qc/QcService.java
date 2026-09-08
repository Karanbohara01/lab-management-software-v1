package np.com.lims.qc;

import np.com.lims.catalog.LabTestRepository;
import np.com.lims.catalog.entity.LabTest;
import np.com.lims.catalog.entity.TestParameter;
import np.com.lims.common.audit.AuditService;
import np.com.lims.common.exception.ApiException;
import np.com.lims.common.exception.ErrorCode;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Service
public class QcService {

    private static final String MODULE = "QC";

    // ---- DTOs -------------------------------------------------------------

    public record TargetDto(Long parameterId, String parameterName, String unit,
                            BigDecimal targetMean, BigDecimal targetSd, QcTargetSource source) {
        static TargetDto from(QcTarget t) {
            return new TargetDto(t.getParameter().getId(), t.getParameter().getName(), t.getUnit(),
                    t.getTargetMean(), t.getTargetSd(), t.getSource());
        }
    }

    public record MaterialDto(Long id, String name, String manufacturer, String lotNumber, QcLevel level,
                              Long testId, String testCode, String testName, LocalDate expiryDate, String note,
                              boolean active, List<TargetDto> targets) {
        static MaterialDto from(QcMaterial m) {
            return new MaterialDto(m.getId(), m.getName(), m.getManufacturer(), m.getLotNumber(), m.getLevel(),
                    m.getTest().getId(), m.getTest().getCode(), m.getTest().getName(), m.getExpiryDate(), m.getNote(),
                    m.isActive(), m.getTargets().stream().map(TargetDto::from).toList());
        }
    }

    public record MaterialUpsert(String name, String manufacturer, String lotNumber, QcLevel level,
                                 Long testId, LocalDate expiryDate, String note, Boolean active,
                                 List<TargetUpsert> targets) {}

    public record TargetUpsert(Long parameterId, BigDecimal targetMean, BigDecimal targetSd, String unit,
                               QcTargetSource source) {}

    public record RunRequest(Long materialId, Long parameterId, BigDecimal value,
                             String analyzer, String shift, String comment) {}

    public record RunDto(Long id, Long materialId, String materialName, QcLevel level,
                         Long parameterId, String parameterName, BigDecimal value, BigDecimal targetMean,
                         BigDecimal targetSd, BigDecimal zScore, QcStatus status, String violatedRules,
                         String analyzer, String shift, String operator, boolean accepted, String comment,
                         Instant runAt) {
        static RunDto from(QcRun r) {
            return new RunDto(r.getId(), r.getMaterial().getId(), r.getMaterial().getName(), r.getMaterial().getLevel(),
                    r.getParameter().getId(), r.getParameter().getName(), r.getValue(), r.getTargetMean(),
                    r.getTargetSd(), r.getZScore(), r.getStatus(), r.getViolatedRules(), r.getAnalyzer(),
                    r.getShift(), r.getOperator(), r.isAccepted(), r.getComment(), r.getRunAt());
        }
    }

    public record LeveyJenningsPoint(Long runId, Instant runAt, BigDecimal value, BigDecimal zScore,
                                     QcStatus status, String violatedRules) {}

    public record LeveyJennings(BigDecimal mean, BigDecimal sd, List<LeveyJenningsPoint> points) {}

    public enum ControlState { NOT_CONFIGURED, NOT_ESTABLISHED, IN_CONTROL, WARNING, OUT_OF_CONTROL }

    public record ControlStatus(ControlState state, List<String> messages) {}

    // ---- wiring ---------------------------------------------------------

    private final QcMaterialRepository materialRepository;
    private final QcRunRepository runRepository;
    private final LabTestRepository testRepository;
    private final WestgardEvaluator westgard;
    private final AuditService auditService;

    public QcService(QcMaterialRepository materialRepository, QcRunRepository runRepository,
                     LabTestRepository testRepository, WestgardEvaluator westgard, AuditService auditService) {
        this.materialRepository = materialRepository;
        this.runRepository = runRepository;
        this.testRepository = testRepository;
        this.westgard = westgard;
        this.auditService = auditService;
    }

    // ---- materials -----------------------------------------------------

    @Transactional(readOnly = true)
    public List<MaterialDto> materials() {
        return materialRepository.findAllByOrderByNameAscLevelAsc().stream().map(MaterialDto::from).toList();
    }

    @Transactional
    public MaterialDto saveMaterial(Long id, MaterialUpsert req) {
        LabTest test = testRepository.findDetailedById(req.testId())
                .orElseThrow(() -> ApiException.notFound("Test", req.testId()));
        QcMaterial material = id == null ? QcMaterial.create(test)
                : materialRepository.findWithTargetsById(id).orElseThrow(() -> ApiException.notFound("QC material", id));
        material.update(trim(req.name()), trim(req.manufacturer()), trim(req.lotNumber()), req.level(),
                req.expiryDate(), trim(req.note()), req.active() == null || req.active());
        material.clearTargets();
        var paramsById = test.getParameters().stream()
                .collect(java.util.stream.Collectors.toMap(TestParameter::getId, p -> p));
        if (req.targets() != null) {
            for (TargetUpsert t : req.targets()) {
                TestParameter p = paramsById.get(t.parameterId());
                if (p == null || t.targetMean() == null || t.targetSd() == null) {
                    continue;
                }
                material.addTarget(p, t.targetMean(), t.targetSd(), trim(t.unit()),
                        t.source() == null ? QcTargetSource.ASSIGNED : t.source());
            }
        }
        QcMaterial saved = id == null ? materialRepository.save(material) : material;
        auditService.record(MODULE, id == null ? "CREATE_MATERIAL" : "UPDATE_MATERIAL", "QcMaterial", saved.getId(),
                "QC material " + saved.getName() + " for " + test.getCode(), null, null);
        return MaterialDto.from(saved);
    }

    // ---- runs ---------------------------------------------------------

    @Transactional
    public RunDto recordRun(RunRequest req) {
        QcMaterial material = materialRepository.findWithTargetsById(req.materialId())
                .orElseThrow(() -> ApiException.notFound("QC material", req.materialId()));
        QcTarget target = material.getTargets().stream()
                .filter(t -> t.getParameter().getId().equals(req.parameterId())).findFirst()
                .orElseThrow(() -> new ApiException(ErrorCode.VALIDATION_FAILED,
                        "No QC target is configured for that parameter on " + material.getName()));
        if (req.value() == null) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "A QC value is required");
        }

        BigDecimal sd = target.getTargetSd();
        BigDecimal z = sd.signum() == 0 ? BigDecimal.ZERO
                : req.value().subtract(target.getTargetMean()).divide(sd, 3, RoundingMode.HALF_UP);

        List<Double> history = runRepository
                .findByMaterialIdAndParameterIdOrderByRunAtDesc(material.getId(), req.parameterId(), PageRequest.of(0, 12))
                .stream().map(r -> r.getZScore() == null ? 0.0 : r.getZScore().doubleValue()).toList();

        var evaluation = westgard.evaluate(z.doubleValue(), history);
        String rules = evaluation.rules().isEmpty() ? null : String.join(",", evaluation.rules());

        QcRun run = runRepository.save(QcRun.record(material, target.getParameter(), req.value(),
                target.getTargetMean(), sd, z, evaluation.status(), rules, trim(req.analyzer()), trim(req.shift()),
                np.com.lims.common.web.CurrentUser.username(), trim(req.comment())));

        auditService.record(MODULE, "RUN", "QcRun", run.getId(),
                "QC " + material.getName() + " / " + target.getParameter().getName() + " = " + req.value()
                        + " (z " + z + ", " + evaluation.status()
                        + (rules == null ? "" : " – " + rules) + ")", null, null);
        return RunDto.from(run);
    }

    @Transactional
    public RunDto acceptRun(Long runId, String comment) {
        QcRun run = runRepository.findById(runId).orElseThrow(() -> ApiException.notFound("QC run", runId));
        run.accept(trim(comment));
        auditService.record(MODULE, "ACCEPT_RUN", "QcRun", runId,
                "Accepted QC run for " + run.getParameter().getName() + " despite " + run.getStatus(), null, null);
        return RunDto.from(run);
    }

    @Transactional(readOnly = true)
    public List<RunDto> runsForTest(Long testId, int limit) {
        return runRepository.findByTestIdOrderByRunAtDesc(testId, PageRequest.of(0, Math.min(limit, 200)))
                .stream().map(RunDto::from).toList();
    }

    @Transactional(readOnly = true)
    public LeveyJennings leveyJennings(Long materialId, Long parameterId) {
        QcMaterial material = materialRepository.findWithTargetsById(materialId)
                .orElseThrow(() -> ApiException.notFound("QC material", materialId));
        QcTarget target = material.getTargets().stream()
                .filter(t -> t.getParameter().getId().equals(parameterId)).findFirst()
                .orElseThrow(() -> ApiException.notFound("QC target", parameterId));
        var points = runRepository
                .findByMaterialIdAndParameterIdOrderByRunAtDesc(materialId, parameterId, PageRequest.of(0, 40))
                .stream()
                .map(r -> new LeveyJenningsPoint(r.getId(), r.getRunAt(), r.getValue(), r.getZScore(),
                        r.getStatus(), r.getViolatedRules()))
                .toList();
        var chrono = new java.util.ArrayList<>(points);
        java.util.Collections.reverse(chrono);
        return new LeveyJennings(target.getTargetMean(), target.getTargetSd(), chrono);
    }

    // ---- lockout ----------------------------------------------------

    @Transactional(readOnly = true)
    public ControlStatus controlStatus(Long testId) {
        boolean configured = !materialRepository.findByTestIdAndActiveTrue(testId).isEmpty();
        if (!configured) {
            return new ControlStatus(ControlState.NOT_CONFIGURED, List.of());
        }
        List<QcRun> latest = runRepository.findLatestPerSeriesForTest(testId);
        if (latest.isEmpty()) {
            return new ControlStatus(ControlState.NOT_ESTABLISHED, List.of("No QC has been run for this test yet."));
        }
        List<String> messages = new java.util.ArrayList<>();
        boolean rejected = false;
        boolean warning = false;
        Instant cutoff = Instant.now().minus(java.time.Duration.ofDays(2));
        for (QcRun r : latest) {
            if (r.getStatus() == QcStatus.REJECTED && !r.isAccepted()) {
                rejected = true;
                messages.add(r.getMaterial().getName() + " / " + r.getParameter().getName()
                        + " — rejected (" + r.getViolatedRules() + ")");
            } else if (r.getStatus() == QcStatus.WARNING) {
                warning = true;
            }
            if (r.getRunAt().isBefore(cutoff)) {
                messages.add(r.getMaterial().getName() + " / " + r.getParameter().getName()
                        + " — last QC is over 48h old");
            }
        }
        if (rejected) {
            return new ControlStatus(ControlState.OUT_OF_CONTROL, messages);
        }
        return new ControlStatus(warning ? ControlState.WARNING : ControlState.IN_CONTROL, messages);
    }

    /** True when patient results for this test must not be approved without an override. */
    @Transactional(readOnly = true)
    public boolean isLocked(Long testId) {
        return controlStatus(testId).state() == ControlState.OUT_OF_CONTROL;
    }

    private static String trim(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
