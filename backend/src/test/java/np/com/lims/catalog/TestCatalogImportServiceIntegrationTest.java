package np.com.lims.catalog;

import np.com.lims.catalog.dto.TestImportDtos.ImportResult;
import np.com.lims.catalog.entity.LabTest;
import np.com.lims.catalog.entity.ParameterDataType;
import np.com.lims.catalog.entity.TestType;
import np.com.lims.common.tenant.TenantContext;
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

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The CSV bulk import, against a real MySQL — this is the part worth proving end to end: a new
 * code creates a test with an auto-created department, a re-uploaded code updates it in place
 * without touching an existing parameter, a bad row is reported but doesn't block its siblings,
 * and an existing profile/panel test is refused rather than silently misclassified.
 *
 * <p>Not {@code @Transactional}, deliberately, and for two independent reasons. First, the one
 * {@code PatientImportIntegrationTest} already gives: each row commits on its own (see
 * {@code TestCatalogImportService}'s class doc), and a test that rolled everything back would
 * never see what it actually wrote. Second, a more specific trap: {@code AuditService.record} is
 * {@code Propagation.REQUIRES_NEW} (so an audit entry survives even if its caller's transaction
 * later rolls back), and {@code audit_log.organization_id} has a real foreign key to
 * {@code organization}. Wrap this test in one outer transaction and that FK check deadlocks
 * against it: the audit insert's new, separate transaction blocks for up to
 * {@code innodb_lock_wait_timeout} waiting to see the very organization row the outer transaction
 * created but — being one giant uncommitted test transaction — never commits. Found by running
 * into it directly: every test failed identically on the first audit insert with a MySQL "Lock
 * wait timeout exceeded", which cleared the instant the JVM exited and the connection dropped.
 *
 * <p>Without a surrounding transaction, codes and department names are looked up with no
 * organization id in scope — the Hibernate tenant filter is enabled per-HTTP-request by
 * {@code TenantFilterInterceptor}, which a test that calls the service directly never runs — so
 * an unqualified "CBC"/"Haematology" would just as happily match another organization's row
 * already sitting in this same shared dev database. {@link #code}/{@link #dept} suffix every
 * name with this test's own organization id so that can't happen, the same fix
 * {@code RevenueAccuracyIntegrationTest} uses (there, safely paired with {@code @Transactional}
 * only because nothing on its path writes an audit entry).
 */
@SpringBootTest
class TestCatalogImportServiceIntegrationTest {

    @DynamicPropertySource
    static void props(DynamicPropertyRegistry registry) {
        registry.add("lims.security.jwt.secret", () -> "integration-test-secret-integration-test-secret");
    }

    @Autowired TestCatalogImportService importService;
    @Autowired LabTestRepository testRepository;
    @Autowired OrganizationRepository organizations;
    @Autowired LaboratoryProfileService laboratoryProfiles;

    private Long orgId;

    @BeforeEach
    void setUp() {
        orgId = organizations.save(Organization.create("catimp-" + System.nanoTime(), "Catalog Import Test Clinic")).getId();
        TenantContext.set(orgId);
        laboratoryProfiles.ensureProvisioned(orgId, "Catalog Import Test Clinic");
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    private String code(String base) {
        return base + orgId;
    }

    private String dept(String base) {
        return base + orgId;
    }

    private static MockMultipartFile csv(String body) {
        return new MockMultipartFile("file", "tests.csv", "text/csv", body.getBytes(StandardCharsets.UTF_8));
    }

    @Test
    void createsANewTestWithAnAutoCreatedDepartment() {
        String cbc = code("CBC");
        String body = "code,name,department,price\n" + cbc + ",Complete Blood Count," + dept("Haematology") + ",450\n";

        ImportResult result = importService.importCsv(csv(body));

        assertThat(result.created()).hasSize(1);
        assertThat(result.updated()).isEmpty();
        assertThat(result.errors()).isEmpty();

        LabTest saved = testRepository.findByCodeIgnoreCase(cbc).orElseThrow();
        assertThat(saved.getName()).isEqualTo("Complete Blood Count");
        assertThat(saved.getDepartment().getName()).isEqualTo(dept("Haematology"));
        assertThat(saved.getPrice()).isEqualByComparingTo("450");
        assertThat(saved.getType()).isEqualTo(TestType.ANALYTE);
        assertThat(saved.isActive()).isTrue();
    }

    @Test
    void reimportingAnExistingCodeUpdatesItWithoutTouchingItsParameters() {
        String cbc = code("CBC");
        String haem = dept("Haematology");
        importService.importCsv(csv("code,name,department,price\n" + cbc + ",Complete Blood Count," + haem + ",450\n"));
        // findDetailedById, not findByCodeIgnoreCase: parameters is LAZY, and outside any
        // transaction here (this test, unlike LabTestService's own callers, has no surrounding
        // session to lazily initialize it in) only the @EntityGraph-fetched path has it loaded.
        Long createdId = testRepository.findByCodeIgnoreCase(cbc).orElseThrow().getId();
        LabTest created = testRepository.findDetailedById(createdId).orElseThrow();
        created.addParameter("HGB", "Haemoglobin", "g/dL", ParameterDataType.NUMERIC, 1);
        testRepository.save(created);

        ImportResult result = importService.importCsv(
                csv("code,name,department,price\n" + cbc + ",Complete Blood Count," + haem + ",500\n"));

        assertThat(result.created()).isEmpty();
        assertThat(result.updated()).hasSize(1);
        assertThat(result.errors()).isEmpty();

        LabTest updated = testRepository.findDetailedById(createdId).orElseThrow();
        assertThat(updated.getPrice()).isEqualByComparingTo("500");
        assertThat(updated.getParameters()).hasSize(1);
        assertThat(updated.getParameters().get(0).getName()).isEqualTo("Haemoglobin");
    }

    @Test
    void aBadRowIsReportedButDoesNotBlockTheOthers() {
        String cbc = code("CBC");
        String bad = code("BAD");
        String tsh = code("TSH");
        String haem = dept("Haematology");
        String endo = dept("Endocrinology");
        String body = "code,name,department,price\n"
                + cbc + ",Complete Blood Count," + haem + ",450\n"
                + bad + ",Broken Row," + haem + ",not-a-number\n"
                + tsh + ",Thyroid Stimulating Hormone," + endo + ",600\n";

        ImportResult result = importService.importCsv(csv(body));

        assertThat(result.created()).hasSize(2);
        assertThat(result.errors()).hasSize(1);
        assertThat(result.errors().get(0).code()).isEqualTo(bad);
        assertThat(result.errors().get(0).message()).contains("price");
        assertThat(testRepository.existsByCodeIgnoreCase(bad)).isFalse();
        assertThat(testRepository.existsByCodeIgnoreCase(cbc)).isTrue();
        assertThat(testRepository.existsByCodeIgnoreCase(tsh)).isTrue();
    }

    @Test
    void refusesToEditAnExistingProfileTestRatherThanMisclassifyingIt() {
        String comp1 = code("COMP1");
        String profile1 = code("PROFILE1");
        String haem = dept("Haematology");
        importService.importCsv(csv("code,name,department,price\n" + comp1 + ",Component One," + haem + ",100\n"));
        LabTest component = testRepository.findByCodeIgnoreCase(comp1).orElseThrow();

        LabTest profile = LabTest.create(profile1, "A Panel", component.getDepartment());
        profile.updateDetails("A Panel", TestType.PROFILE, component.getDepartment(), null,
                component.getSpecimenType(), null, null, BigDecimal.TEN, null, null);
        profile.addProfileMember(component, 0);
        testRepository.save(profile);

        ImportResult result = importService.importCsv(
                csv("code,name,department,price\n" + profile1 + ",A Panel," + haem + ",150\n"));

        assertThat(result.updated()).isEmpty();
        assertThat(result.created()).isEmpty();
        assertThat(result.errors()).hasSize(1);
        assertThat(result.errors().get(0).message()).contains("profile");

        LabTest unchanged = testRepository.findByCodeIgnoreCase(profile1).orElseThrow();
        assertThat(unchanged.getPrice()).isEqualByComparingTo("10");
    }
}
