package np.com.lims.catalog;

import np.com.lims.catalog.dto.TestDtos.CreateRequest;
import np.com.lims.catalog.dto.TestDtos.Detail;
import np.com.lims.catalog.dto.TestDtos.ListItem;
import np.com.lims.catalog.dto.TestDtos.ParameterRequest;
import np.com.lims.catalog.dto.TestDtos.RangeRequest;
import np.com.lims.catalog.dto.TestDtos.SpecimenHandling;
import np.com.lims.catalog.dto.TestDtos.UpdateRequest;
import np.com.lims.catalog.entity.AgeUnit;
import np.com.lims.catalog.entity.LabTest;
import np.com.lims.catalog.entity.TestParameter;
import np.com.lims.catalog.entity.TestType;
import np.com.lims.common.audit.AuditService;
import np.com.lims.common.exception.ApiException;
import np.com.lims.common.exception.ErrorCode;
import np.com.lims.common.formula.FormulaEvaluator;
import np.com.lims.department.DepartmentRepository;
import np.com.lims.department.entity.Department;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Optional;

@Service
public class LabTestService {

    private static final String MODULE = "TEST_CATALOG";

    private final LabTestRepository testRepository;
    private final DepartmentRepository departmentRepository;
    private final AuditService auditService;

    public LabTestService(LabTestRepository testRepository,
                          DepartmentRepository departmentRepository,
                          AuditService auditService) {
        this.testRepository = testRepository;
        this.departmentRepository = departmentRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public Page<ListItem> search(String query, Long departmentId, boolean activeOnly, Pageable pageable) {
        String normalized = StringUtils.hasText(query) ? query.trim() : null;
        return testRepository.search(normalized, departmentId, activeOnly, pageable).map(ListItem::from);
    }

    @Transactional(readOnly = true)
    public Detail get(Long id) {
        return Detail.from(load(id));
    }

    @Transactional
    public Detail create(CreateRequest request) {
        String code = request.code().trim().toUpperCase();
        if (testRepository.existsByCodeIgnoreCase(code)) {
            throw ApiException.conflict("A test with code " + code + " already exists");
        }
        Department department = department(request.departmentId());
        LabTest test = LabTest.create(code, request.name().trim(), department);
        test.updateDetails(request.name().trim(), request.type(), department, trimToNull(request.category()),
                request.specimenType(), trimToNull(request.specimenRequirements()),
                trimToNull(request.method()), request.price(), request.turnaroundHours(),
                trimToNull(request.loincCode()));
        applyHandling(test, request.specimenHandling());
        test.setResultMode(request.resultMode());
        test.setAutoVerifyEnabled(request.autoVerifyEnabled());
        applyStructure(test, request.type(), request.parameters(), request.memberTestIds());

        LabTest saved = testRepository.save(test);
        auditService.record(MODULE, "CREATE", "LabTest", saved.getId(),
                "Created test " + saved.getCode() + " – " + saved.getName(), null, Detail.from(saved));
        return Detail.from(saved);
    }

    @Transactional
    public Detail update(Long id, UpdateRequest request) {
        LabTest test = load(id);
        Detail before = Detail.from(test);
        Department department = department(request.departmentId());
        test.updateDetails(request.name().trim(), request.type(), department, trimToNull(request.category()),
                request.specimenType(), trimToNull(request.specimenRequirements()),
                trimToNull(request.method()), request.price(), request.turnaroundHours(),
                trimToNull(request.loincCode()));
        applyHandling(test, request.specimenHandling());
        test.setResultMode(request.resultMode());
        test.setAutoVerifyEnabled(request.autoVerifyEnabled());
        applyStructure(test, request.type(), request.parameters(), request.memberTestIds());

        auditService.record(MODULE, "UPDATE", "LabTest", id,
                "Updated test " + test.getCode(), before, Detail.from(test));
        return Detail.from(test);
    }

    private void applyHandling(LabTest test, SpecimenHandling h) {
        SpecimenHandling s = h == null ? SpecimenHandling.EMPTY : h;
        test.updateSpecimenHandling(trimToNull(s.containerType()), s.minVolumeMl(), trimToNull(s.stabilityNote()),
                s.fastingRequired(), s.fastingHours(), s.referral(), trimToNull(s.referralLab()));
    }

    /** Dispatches: an ANALYTE carries parameters, a PROFILE carries member tests. */
    private void applyStructure(LabTest test, TestType type, List<ParameterRequest> parameters, List<Long> memberIds) {
        if (type == TestType.PROFILE) {
            test.clearParameters();
            replaceMembers(test, memberIds);
        } else {
            test.clearProfileMembers();
            replaceParameters(test, parameters);
        }
    }

    private void replaceMembers(LabTest profile, List<Long> memberIds) {
        profile.clearProfileMembers();
        if (memberIds == null || memberIds.isEmpty()) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "A profile must contain at least one member test");
        }
        int order = 0;
        java.util.Set<Long> seen = new java.util.HashSet<>();
        for (Long memberId : memberIds) {
            if (memberId == null || !seen.add(memberId)) {
                continue;
            }
            if (memberId.equals(profile.getId())) {
                throw new ApiException(ErrorCode.VALIDATION_FAILED, "A profile cannot contain itself");
            }
            LabTest member = testRepository.findById(memberId)
                    .orElseThrow(() -> ApiException.notFound("Test", memberId));
            if (member.getType() == TestType.PROFILE) {
                throw new ApiException(ErrorCode.VALIDATION_FAILED,
                        "Profile member " + member.getCode() + " is itself a profile — nested profiles are not allowed");
            }
            profile.addProfileMember(member, order++);
        }
    }

    @Transactional
    public void setActive(Long id, boolean active) {
        LabTest test = load(id);
        if (test.isActive() == active) {
            return;
        }
        test.setActive(active);
        auditService.record(MODULE, active ? "ACTIVATE" : "DEACTIVATE", "LabTest", id,
                (active ? "Activated" : "Deactivated") + " test " + test.getCode(), null, null);
    }

    /** Full replace of the parameter/range tree — the catalog editor always sends the complete set. */
    private void replaceParameters(LabTest test, List<ParameterRequest> parameters) {
        test.clearParameters();
        if (parameters == null) {
            return;
        }
        java.util.Set<String> codes = parameters.stream()
                .map(p -> trimToNull(p.code())).filter(java.util.Objects::nonNull)
                .map(String::toLowerCase).collect(java.util.stream.Collectors.toSet());

        for (ParameterRequest pr : parameters) {
            String formula = trimToNull(pr.calculationFormula());
            if (formula != null) {
                java.util.Set<String> unknown = FormulaEvaluator.referencedNames(formula).stream()
                        .filter(n -> !n.equals("age") && !n.equals("ageDays") && !n.equals("sexM") && !n.equals("sexF"))
                        .filter(n -> !codes.contains(n.toLowerCase()))
                        .collect(java.util.stream.Collectors.toCollection(java.util.LinkedHashSet::new));
                if (!unknown.isEmpty()) {
                    throw new ApiException(ErrorCode.VALIDATION_FAILED, "Formula for \"" + pr.name()
                            + "\" references unknown parameter code(s): " + String.join(", ", unknown)
                            + ". Use the codes of other parameters in this test.");
                }
            }
            TestParameter parameter = test.addParameter(trimToNull(pr.code()), pr.name().trim(),
                    trimToNull(pr.unit()), pr.dataType(), pr.displayOrder());
            parameter.configure(pr.decimalPlaces(), formula, normalizeAllowed(pr.allowedValues()),
                    pr.absurdLow(), pr.absurdHigh(), trimToNull(pr.method()), trimToNull(pr.loincCode()),
                    trimToNull(pr.groupHeading()), pr.deltaCheckPercent());
            if (pr.referenceRanges() != null) {
                for (RangeRequest rr : pr.referenceRanges()) {
                    parameter.addRange(rr.appliesToGender(), rr.ageLow(), rr.ageHigh(),
                            rr.ageUnit() == null ? AgeUnit.YEARS : rr.ageUnit(),
                            rr.lowValue(), rr.highValue(), trimToNull(rr.normalText()),
                            rr.criticalLow(), rr.criticalHigh(),
                            rr.effectiveFrom(), trimToNull(rr.source()), rr.appliesToPregnant());
                }
            }
        }
    }

    private static String normalizeAllowed(String raw) {
        if (!StringUtils.hasText(raw)) {
            return null;
        }
        return java.util.Arrays.stream(raw.split("[|,\\n]"))
                .map(String::trim).filter(s -> !s.isEmpty())
                .collect(java.util.stream.Collectors.joining("|"));
    }

    private Department department(Long departmentId) {
        return departmentRepository.findById(departmentId)
                .orElseThrow(() -> ApiException.notFound("Department", departmentId));
    }

    private LabTest load(Long id) {
        return testRepository.findDetailedById(id).orElseThrow(() -> ApiException.notFound("Test", id));
    }

    private static String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    /** Loads active tests by id, throwing if any requested id is missing/inactive. Used by lab orders. */
    @Transactional(readOnly = true)
    public List<LabTest> requireActiveTests(List<Long> ids) {
        List<LabTest> found = testRepository.findByIdInAndActiveTrue(ids);
        if (found.size() != ids.stream().distinct().count()) {
            List<Long> foundIds = found.stream().map(LabTest::getId).toList();
            Optional<Long> missing = ids.stream().filter(id -> !foundIds.contains(id)).findFirst();
            throw ApiException.conflict("Test is not available for ordering: " + missing.orElse(null));
        }
        return found;
    }
}
