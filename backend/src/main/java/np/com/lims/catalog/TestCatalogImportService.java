package np.com.lims.catalog;

import np.com.lims.catalog.dto.TestDtos.CatalogFieldsUpdate;
import np.com.lims.catalog.dto.TestDtos.CreateRequest;
import np.com.lims.catalog.dto.TestDtos.SpecimenHandling;
import np.com.lims.catalog.dto.TestImportDtos.ImportResult;
import np.com.lims.catalog.dto.TestImportDtos.RowError;
import np.com.lims.catalog.entity.LabTest;
import np.com.lims.catalog.entity.ResultMode;
import np.com.lims.catalog.entity.SpecimenType;
import np.com.lims.catalog.entity.TestType;
import np.com.lims.common.exception.ApiException;
import np.com.lims.common.exception.ErrorCode;
import np.com.lims.department.DepartmentRepository;
import np.com.lims.department.entity.Department;
import np.com.lims.patientimport.read.CsvReader;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Bulk CSV create/update for the lab's own test catalog — the "migrate a few hundred tests from
 * our old software" path, distinct from the platform's curated Master Catalogue import
 * ({@code MasterCatalogService.importInto}, which copies whole fully-specified tests including
 * their parameters). A CSV row only ever carries the catalog-level fields in
 * {@link TestCatalogCsvWriter#HEADER} — never parameters, never profile membership — so this
 * service creates/updates plain ANALYTE tests via {@link LabTestService#create} and
 * {@link LabTestService#updateCatalogFields}, the latter chosen specifically because it leaves an
 * existing test's parameter/reference-range tree untouched (see that method's javadoc).
 *
 * <p>Deliberately synchronous and row-tolerant, not a background job: a test catalog is hundreds
 * of rows, not the hundreds of thousands a patient import can see, so there's no need for
 * {@code PatientImportService}'s staged-rows-table/worker/polling machinery. Each row is its own
 * transaction (via the {@code @Transactional} methods on {@link LabTestService} it calls) — one
 * bad row is reported and skipped, every other row still commits, matching
 * {@code MasterCatalogService.importInto}'s skip-rather-than-abort precedent.
 */
@Service
public class TestCatalogImportService {

    private final LabTestRepository testRepository;
    private final LabTestService testService;
    private final DepartmentRepository departmentRepository;

    public TestCatalogImportService(LabTestRepository testRepository, LabTestService testService,
                                    DepartmentRepository departmentRepository) {
        this.testRepository = testRepository;
        this.testService = testService;
        this.departmentRepository = departmentRepository;
    }

    public ImportResult importCsv(MultipartFile file) {
        List<String> created = new ArrayList<>();
        List<String> updated = new ArrayList<>();
        List<RowError> errors = new ArrayList<>();

        try (CsvReader reader = new CsvReader(file.getInputStream())) {
            List<String> header = reader.next();
            if (header == null) {
                throw new ApiException(ErrorCode.VALIDATION_FAILED, "The file is empty");
            }
            Map<String, Integer> col = indexOf(header);
            for (String required : List.of("code", "name", "department", "price")) {
                if (!col.containsKey(required)) {
                    throw new ApiException(ErrorCode.VALIDATION_FAILED,
                            "The file is missing a \"" + required + "\" column");
                }
            }

            List<String> row;
            while ((row = reader.next()) != null) {
                int rowNumber = reader.rowNumber();
                String rowCode = cell(row, col, "code");
                try {
                    processRow(col, row, created, updated);
                } catch (ApiException e) {
                    errors.add(new RowError(rowNumber, rowCode, e.getMessage()));
                }
            }
        } catch (IOException e) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "Could not read the file: " + e.getMessage());
        }

        return new ImportResult(created, updated, errors);
    }

    private void processRow(Map<String, Integer> col, List<String> row, List<String> created, List<String> updated) {
        String code = requireText(row, col, "code").trim().toUpperCase();
        if (!code.matches("[A-Za-z0-9._-]+")) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED,
                    "\"" + code + "\" may only contain letters, digits, . - _");
        }
        String name = requireText(row, col, "name").trim();
        Department department = findOrCreateDepartment(requireText(row, col, "department").trim());

        ResultMode resultMode = parseEnum(cell(row, col, "resultMode"), ResultMode.class, ResultMode.PARAMETRIC, "resultMode");
        SpecimenType specimenType = parseEnum(cell(row, col, "specimenType"), SpecimenType.class, SpecimenType.BLOOD_SERUM, "specimenType");
        String category = cell(row, col, "category");
        String specimenRequirements = cell(row, col, "specimenRequirements");
        String method = cell(row, col, "method");
        String loincCode = cell(row, col, "loincCode");
        BigDecimal price = parseDecimal(requireText(row, col, "price"), "price");
        Integer turnaroundHours = parseInt(cell(row, col, "turnaroundHours"), "turnaroundHours");
        String containerType = cell(row, col, "containerType");
        BigDecimal minVolumeMl = parseDecimal(cell(row, col, "minVolumeMl"), "minVolumeMl");
        String stabilityNote = cell(row, col, "stabilityNote");
        boolean fastingRequired = parseBool(cell(row, col, "fastingRequired"), false);
        Integer fastingHours = parseInt(cell(row, col, "fastingHours"), "fastingHours");
        boolean referral = parseBool(cell(row, col, "referral"), false);
        String referralLab = cell(row, col, "referralLab");
        boolean autoVerifyEnabled = parseBool(cell(row, col, "autoVerifyEnabled"), false);
        boolean active = parseBool(cell(row, col, "active"), true);

        SpecimenHandling handling = new SpecimenHandling(containerType, minVolumeMl, stabilityNote,
                fastingRequired, fastingHours, referral, referralLab);

        Optional<LabTest> existing = testRepository.findByCodeIgnoreCase(code);
        if (existing.isPresent()) {
            LabTest test = existing.get();
            if (test.getType() == TestType.PROFILE) {
                throw new ApiException(ErrorCode.VALIDATION_FAILED,
                        code + " is an existing profile/panel test — not editable via CSV");
            }
            CatalogFieldsUpdate fields = new CatalogFieldsUpdate(name, department.getId(), category, specimenType,
                    specimenRequirements, method, loincCode, price, turnaroundHours, resultMode,
                    autoVerifyEnabled, handling);
            testService.updateCatalogFields(test.getId(), fields);
            if (test.isActive() != active) {
                testService.setActive(test.getId(), active);
            }
            updated.add(code + " – " + name);
        } else {
            CreateRequest request = new CreateRequest(code, name, TestType.ANALYTE, resultMode, department.getId(),
                    category, specimenType, specimenRequirements, method, loincCode, price, turnaroundHours,
                    handling, autoVerifyEnabled, List.of(), null);
            var createdTest = testService.create(request);
            if (!active) {
                testService.setActive(createdTest.id(), false);
            }
            created.add(code + " – " + name);
        }
    }

    /** Clinics don't share a Department row — find one by name in the current org, or create it.
     * Mirrors {@code MasterCatalogService.findOrCreateDepartment} exactly; duplicated rather than
     * shared since the two callers live in different packages for a few lines of logic. */
    private Department findOrCreateDepartment(String name) {
        return departmentRepository.findByNameIgnoreCase(name).orElseGet(() -> {
            String code = deriveDepartmentCode(name);
            Department d = Department.create(code, name);
            d.update(name, "Auto-created while importing the test catalog");
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

    private static Map<String, Integer> indexOf(List<String> header) {
        Map<String, Integer> map = new HashMap<>();
        for (int i = 0; i < header.size(); i++) {
            String key = header.get(i) == null ? "" : header.get(i).trim().toLowerCase();
            if (!key.isEmpty()) {
                map.putIfAbsent(key, i);
            }
        }
        return map;
    }

    private static String cell(List<String> row, Map<String, Integer> col, String name) {
        Integer idx = col.get(name.toLowerCase());
        if (idx == null || idx >= row.size()) {
            return null;
        }
        String v = row.get(idx);
        return v == null ? null : v.trim();
    }

    private static String requireText(List<String> row, Map<String, Integer> col, String name) {
        String v = cell(row, col, name);
        if (!StringUtils.hasText(v)) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "\"" + name + "\" is required");
        }
        return v;
    }

    private static <E extends Enum<E>> E parseEnum(String raw, Class<E> type, E defaultValue, String columnName) {
        if (!StringUtils.hasText(raw)) {
            return defaultValue;
        }
        try {
            return Enum.valueOf(type, raw.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            String valid = String.join(", ", Arrays.stream(type.getEnumConstants()).map(Enum::name).toList());
            throw new ApiException(ErrorCode.VALIDATION_FAILED,
                    "\"" + raw + "\" is not a valid " + columnName + " — use one of: " + valid);
        }
    }

    private static BigDecimal parseDecimal(String raw, String columnName) {
        if (!StringUtils.hasText(raw)) {
            return null;
        }
        try {
            return new BigDecimal(raw.trim());
        } catch (NumberFormatException e) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "\"" + raw + "\" is not a valid number for " + columnName);
        }
    }

    private static Integer parseInt(String raw, String columnName) {
        if (!StringUtils.hasText(raw)) {
            return null;
        }
        try {
            return Integer.parseInt(raw.trim());
        } catch (NumberFormatException e) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "\"" + raw + "\" is not a whole number for " + columnName);
        }
    }

    private static boolean parseBool(String raw, boolean defaultValue) {
        if (!StringUtils.hasText(raw)) {
            return defaultValue;
        }
        String v = raw.trim().toLowerCase();
        if (v.equals("true") || v.equals("yes") || v.equals("1")) {
            return true;
        }
        if (v.equals("false") || v.equals("no") || v.equals("0")) {
            return false;
        }
        throw new ApiException(ErrorCode.VALIDATION_FAILED, "\"" + raw + "\" is not a valid true/false value");
    }
}
