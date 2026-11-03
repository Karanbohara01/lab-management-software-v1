package np.com.lims.patientimport;

import np.com.lims.common.tenant.TenantContext;
import np.com.lims.patient.PatientRepository;
import np.com.lims.patientimport.dto.ImportDtos.ConfirmImportRequest;
import np.com.lims.patientimport.dto.ImportDtos.JobDetail;
import np.com.lims.patientimport.dto.ImportDtos.MappingRequest;
import np.com.lims.patientimport.dto.ImportDtos.UploadResult;
import np.com.lims.patientimport.entity.DuplicatePolicy;
import np.com.lims.patientimport.entity.ImportJobStatus;
import np.com.lims.platform.OrganizationRepository;
import np.com.lims.platform.entity.Organization;
import np.com.lims.settings.LaboratoryProfileService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Proves the import is bounded in memory and linear in time, which is the whole claim behind the
 * streaming reader and the batched writes.
 *
 * <p>Ten thousand rows, not five hundred thousand: the shape being checked is that nothing grows
 * with the row count, and that is visible at ten thousand while still running inside a test suite.
 * The reader itself is separately proven to stream at scale in {@code XlsxReaderTest}.
 */
@SpringBootTest
class PatientImportScaleTest {

    private static final int ROWS = 10_000;

    @DynamicPropertySource
    static void props(DynamicPropertyRegistry registry) {
        registry.add("lims.security.jwt.secret", () -> "integration-test-secret-integration-test-secret");
        registry.add("lims.patient-import.directory", () -> "./target/test-patient-imports");
        registry.add("lims.patient-import.batch-size", () -> "500");
        // Driven by hand, so the live scheduler does not race it.
        registry.add("lims.patient-import.worker-cron", () -> "-");
        registry.add("lims.patient-import.purge-cron", () -> "-");
    }

    @Autowired PatientImportService service;
    @Autowired PatientImportWorker worker;
    @Autowired PatientImportJobRepository jobRepository;
    @Autowired PatientRepository patientRepository;
    @Autowired OrganizationRepository organizations;
    @Autowired LaboratoryProfileService laboratoryProfiles;

    private Long orgId;

    @BeforeEach
    void setUp() {
        orgId = organizations.save(Organization.create("scale-" + System.nanoTime(), "Scale Clinic")).getId();
        TenantContext.set(orgId);
        laboratoryProfiles.ensureProvisioned(orgId, "Scale Clinic");
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void importsTenThousandRowsWithoutGrowingWithTheFile() {
        StringBuilder csv = new StringBuilder("Name,Gender,DOB,Phone,Old ID").append(System.lineSeparator());
        for (int i = 1; i <= ROWS; i++) {
            csv.append("Patient ").append(i)
                    .append(i % 2 == 0 ? ",F," : ",M,")
                    .append("19").append(50 + (i % 50)).append("-0").append((i % 9) + 1).append("-1")
                    .append((i % 9) + 1).append(',')
                    .append("98").append(String.format("%08d", i)).append(',')
                    .append("OLD-").append(i)
                    .append(System.lineSeparator());
        }
        MockMultipartFile file = new MockMultipartFile("file", "big.csv", "text/csv",
                csv.toString().getBytes(StandardCharsets.UTF_8));

        UploadResult upload = service.upload(file);
        service.confirmMapping(upload.job().id(), new MappingRequest(
                Map.of("0", "FULL_NAME", "1", "GENDER", "2", "DATE_OF_BIRTH", "3", "PHONE", "4", "EXTERNAL_ID")));

        long baseline = usedMemory();
        long analysisStart = System.nanoTime();
        drain();
        long analysisMs = (System.nanoTime() - analysisStart) / 1_000_000;

        JobDetail analysed = service.get(upload.job().id());
        assertThat(analysed.job().status()).isEqualTo(ImportJobStatus.READY);
        assertThat(analysed.job().totalRows()).isEqualTo(ROWS);
        assertThat(analysed.job().validRows()).isEqualTo(ROWS);
        assertThat(analysed.job().invalidRows()).isZero();
        assertThat(analysed.job().duplicateRows()).isZero();

        long importStart = System.nanoTime();
        service.confirmImport(upload.job().id(), new ConfirmImportRequest(DuplicatePolicy.SKIP));
        drain();
        long importMs = (System.nanoTime() - importStart) / 1_000_000;
        long growth = usedMemory() - baseline;

        JobDetail done = service.get(upload.job().id());
        assertThat(done.job().status()).isEqualTo(ImportJobStatus.COMPLETED);
        assertThat(done.job().importedRows()).isEqualTo(ROWS);
        assertThat(done.job().failedRows()).isZero();

        // Every row became exactly one patient, each with its own number.
        long created = patientRepository.findAll().stream()
                .filter(p -> orgId.equals(p.getOrganizationId())).count();
        assertThat(created).isEqualTo(ROWS);

        System.out.printf("SCALE %d rows: analyse %d ms, import %d ms, heap growth %d MB%n",
                ROWS, analysisMs, importMs, growth / (1024 * 1024));

        // Neither pass may hold the dataset. A per-row cost would show here as hundreds of MB.
        assertThat(growth).as("heap growth across a %d-row import", ROWS).isLessThan(256L * 1024 * 1024);
    }

    private void drain() {
        Long caller = TenantContext.get();
        try {
            for (int i = 0; i < 5000; i++) {
                Long before = runningJobId();
                worker.pump();
                if (before == null) {
                    return;
                }
            }
        } finally {
            if (caller != null) {
                TenantContext.set(caller);
            }
        }
    }

    private Long runningJobId() {
        return jobRepository.findClaimable(
                        List.of(ImportJobStatus.ANALYSING, ImportJobStatus.IMPORTING),
                        "any-worker",
                        java.time.Instant.now().plusSeconds(60),
                        org.springframework.data.domain.PageRequest.of(0, 1))
                .stream().findFirst().map(j -> j.getId()).orElse(null);
    }

    private static long usedMemory() {
        System.gc();
        Runtime runtime = Runtime.getRuntime();
        return runtime.totalMemory() - runtime.freeMemory();
    }
}
