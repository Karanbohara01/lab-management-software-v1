package np.com.lims.platform;

import np.com.lims.catalog.LabTestRepository;
import np.com.lims.catalog.entity.LabTest;
import np.com.lims.catalog.entity.TestParameter;
import np.com.lims.common.audit.AuditService;
import np.com.lims.common.exception.ApiException;
import np.com.lims.department.DepartmentRepository;
import np.com.lims.department.entity.Department;
import np.com.lims.platform.dto.MasterCatalogDtos.Detail;
import np.com.lims.platform.dto.MasterCatalogDtos.ImportResult;
import np.com.lims.platform.dto.MasterCatalogDtos.ListItem;
import np.com.lims.platform.dto.MasterCatalogDtos.ParameterRequest;
import np.com.lims.platform.dto.MasterCatalogDtos.RangeRequest;
import np.com.lims.platform.dto.MasterCatalogDtos.UpsertRequest;
import np.com.lims.platform.entity.MasterLabTest;
import np.com.lims.platform.entity.MasterTestParameter;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

/**
 * The platform-wide master lab test catalogue: platform-admin CRUD (curating the shared library)
 * plus the clinic-facing "browse and import" flow. See {@link MasterLabTest}'s javadoc for the
 * overall design (not tenant-owned, import copies rather than links).
 */
@Service
public class MasterCatalogService {

    private static final String MODULE = "MASTER_CATALOG";

    private final MasterLabTestRepository repository;
    private final LabTestRepository labTestRepository;
    private final DepartmentRepository departmentRepository;
    private final AuditService auditService;

    public MasterCatalogService(MasterLabTestRepository repository, LabTestRepository labTestRepository,
                                DepartmentRepository departmentRepository, AuditService auditService) {
        this.repository = repository;
        this.labTestRepository = labTestRepository;
        this.departmentRepository = departmentRepository;
        this.auditService = auditService;
    }

    // ===== platform-admin CRUD ========================================

    @Transactional(readOnly = true)
    public List<ListItem> listAll() {
        return repository.findAllByOrderByDisplayOrderAscIdAsc().stream().map(ListItem::from).toList();
    }

    @Transactional(readOnly = true)
    public Detail get(Long id) {
        return Detail.from(load(id));
    }

    @Transactional
    public Detail create(UpsertRequest request) {
        String code = request.code().trim().toUpperCase();
        if (repository.existsByCodeIgnoreCase(code)) {
            throw ApiException.conflict("A master test with code " + code + " already exists");
        }
        MasterLabTest test = MasterLabTest.create(code, request.name().trim(), request.departmentName().trim());
        applyDetails(test, request);
        MasterLabTest saved = repository.save(test);
        auditService.record(MODULE, "CREATE", "MasterLabTest", saved.getId(),
                "Created master test " + saved.getCode() + " – " + saved.getName(), null, Detail.from(saved));
        return Detail.from(saved);
    }

    @Transactional
    public Detail update(Long id, UpsertRequest request) {
        MasterLabTest test = load(id);
        applyDetails(test, request);
        auditService.record(MODULE, "UPDATE", "MasterLabTest", id,
                "Updated master test " + test.getCode(), null, Detail.from(test));
        return Detail.from(test);
    }

    @Transactional
    public void setActive(Long id, boolean active) {
        MasterLabTest test = load(id);
        test.setActive(active);
        auditService.record(MODULE, active ? "ACTIVATE" : "DEACTIVATE", "MasterLabTest", id,
                (active ? "Activated" : "Deactivated") + " master test " + test.getCode(), null, null);
    }

    private void applyDetails(MasterLabTest test, UpsertRequest request) {
        test.update(request.name().trim(), request.departmentName().trim(), trimToNull(request.category()),
                request.specimenType(), request.suggestedPrice(), request.turnaroundHours(), request.displayOrder());
        test.setActive(request.active());
        replaceParameters(test, request.parameters());
    }

    private void replaceParameters(MasterLabTest test, List<ParameterRequest> parameters) {
        test.clearParameters();
        if (parameters == null) {
            return;
        }
        for (ParameterRequest pr : parameters) {
            MasterTestParameter parameter = test.addParameter(trimToNull(pr.code()), pr.name().trim(),
                    trimToNull(pr.unit()), pr.dataType(), pr.displayOrder());
            parameter.configure(pr.decimalPlaces(), trimToNull(pr.groupHeading()));
            if (pr.referenceRanges() != null) {
                for (RangeRequest rr : pr.referenceRanges()) {
                    parameter.addRange(rr.appliesToGender(), rr.lowValue(), rr.highValue(),
                            rr.criticalLow(), rr.criticalHigh(), trimToNull(rr.normalText()));
                }
            }
        }
    }

    // ===== clinic-facing: browse + import ==============================

    @Transactional(readOnly = true)
    public List<ListItem> listActive() {
        return repository.findAllByActiveTrueOrderByDisplayOrderAscIdAsc().stream().map(ListItem::from).toList();
    }

    /**
     * Imports the requested master tests into the CURRENT organization (from {@code TenantContext}
     * via the usual {@code @PrePersist} stamping on {@code LabTest}/{@code Department}). Each
     * import creates a brand-new, independently-owned {@code LabTest} — never a live link back to
     * the master row, so a clinic can freely edit its copy (price, ranges, etc.) afterward without
     * touching the shared catalogue, and a later change to the master doesn't retroactively alter
     * what a clinic already imported. Skips (not errors) any master test whose code the org already
     * has — re-running an import with some already-imported ids is safe.
     */
    @Transactional
    public ImportResult importInto(List<Long> masterTestIds) {
        List<MasterLabTest> masters = repository.findByIdInAndActiveTrue(masterTestIds);
        List<String> imported = new ArrayList<>();
        List<String> skipped = new ArrayList<>();

        for (MasterLabTest master : masters) {
            if (labTestRepository.existsByCodeIgnoreCase(master.getCode())) {
                skipped.add(master.getCode() + " – " + master.getName());
                continue;
            }
            Department department = findOrCreateDepartment(master.getDepartmentName());
            LabTest test = LabTest.create(master.getCode(), master.getName(), department);
            test.updateDetails(master.getName(), np.com.lims.catalog.entity.TestType.ANALYTE, department,
                    master.getCategory(), master.getSpecimenType(), null, null,
                    master.getSuggestedPrice(), master.getTurnaroundHours(), null);

            for (MasterTestParameter mp : master.getParameters()) {
                TestParameter parameter = test.addParameter(mp.getCode(), mp.getName(), mp.getUnit(),
                        mp.getDataType(), mp.getDisplayOrder());
                parameter.configure(mp.getDecimalPlaces(), null, null, null, null, null, null,
                        mp.getGroupHeading(), null);
                for (var mr : mp.getReferenceRanges()) {
                    parameter.addRange(mr.getAppliesToGender(), null, null, np.com.lims.catalog.entity.AgeUnit.YEARS,
                            mr.getLowValue(), mr.getHighValue(), mr.getNormalText(),
                            mr.getCriticalLow(), mr.getCriticalHigh(), null, "Master catalogue", false);
                }
            }

            LabTest saved = labTestRepository.save(test);
            imported.add(saved.getCode() + " – " + saved.getName());
        }

        auditService.record(MODULE, "IMPORT", "LabTest", null,
                "Imported " + imported.size() + " test(s) from the master catalogue"
                        + (skipped.isEmpty() ? "" : " (" + skipped.size() + " skipped, code already exists)"),
                null, imported);
        return new ImportResult(imported, skipped);
    }

    /** Clinics don't share a Department row — find one by name in the current org, or create it. */
    private Department findOrCreateDepartment(String name) {
        return departmentRepository.findByNameIgnoreCase(name).orElseGet(() -> {
            String code = deriveDepartmentCode(name);
            Department d = Department.create(code, name);
            d.update(name, "Auto-created while importing from the master catalogue");
            return departmentRepository.save(d);
        });
    }

    private String deriveDepartmentCode(String name) {
        String base = name.replaceAll("[^A-Za-z]", "").toUpperCase();
        base = base.isEmpty() ? "DEPT" : base.substring(0, Math.min(4, base.length()));
        String candidate = base;
        int suffix = 1;
        while (departmentRepository.existsByCodeIgnoreCase(candidate)) {
            candidate = base + (++suffix);
        }
        return candidate;
    }

    private MasterLabTest load(Long id) {
        return repository.findDetailedById(id).orElseThrow(() -> ApiException.notFound("Master test", id));
    }

    private static String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
