package np.com.lims.patientimport;

import np.com.lims.common.tenant.TenantContext;
import np.com.lims.patient.PatientRepository;
import np.com.lims.patient.entity.Gender;
import np.com.lims.patient.entity.Patient;
import np.com.lims.patient.entity.RegistrationChannel;
import np.com.lims.patientimport.dto.ImportDtos.ConfirmImportRequest;
import np.com.lims.patientimport.dto.ImportDtos.JobDetail;
import np.com.lims.patientimport.dto.ImportDtos.MappingRequest;
import np.com.lims.patientimport.dto.ImportDtos.RowView;
import np.com.lims.patientimport.dto.ImportDtos.UploadResult;
import np.com.lims.patientimport.entity.DuplicatePolicy;
import np.com.lims.patientimport.entity.ImportJobStatus;
import np.com.lims.patientimport.entity.ImportRowStatus;
import np.com.lims.patientimport.entity.PatientImportJob;
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

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * The whole import, end to end, against a real MySQL: upload, map, check, confirm, create.
 *
 * <p>Not transactional, deliberately. The worker commits its own batches, and a test that rolled
 * everything back would never see what it actually wrote — which is the part worth proving. Each
 * test therefore builds its own organization and cleans up after itself.
 */
@SpringBootTest
class PatientImportIntegrationTest {

    @DynamicPropertySource
    static void props(DynamicPropertyRegistry registry) {
        registry.add("lims.security.jwt.secret", () -> "integration-test-secret-integration-test-secret");
        registry.add("lims.patient-import.directory", () -> "./target/test-patient-imports");
        // Small batches, so the batching path is actually exercised by a handful of rows.
        registry.add("lims.patient-import.batch-size", () -> "2");
        // The real worker is switched off so these tests drive it by hand. Left on, the scheduler
        // thread would claim the same jobs concurrently with the test's own pumps and the counts
        // being asserted would be a race.
        registry.add("lims.patient-import.worker-cron", () -> "-");
        registry.add("lims.patient-import.purge-cron", () -> "-");
    }

    @Autowired PatientImportService service;
    @Autowired PatientImportWorker worker;
    @Autowired PatientImportJobRepository jobRepository;
    @Autowired PatientImportRowRepository rowRepository;
    @Autowired PatientRepository patientRepository;
    @Autowired OrganizationRepository organizations;
    @Autowired LaboratoryProfileService laboratoryProfiles;

    private Long orgId;

    @BeforeEach
    void setUp() {
        orgId = organizations.save(Organization.create("imp-" + System.nanoTime(), "Import Test Clinic")).getId();
        TenantContext.set(orgId);
        laboratoryProfiles.ensureProvisioned(orgId, "Import Test Clinic");
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    // ----- helpers ---------------------------------------------------------------------------

    private static MockMultipartFile csv(String name, String body) {
        return new MockMultipartFile("file", name, "text/csv", body.getBytes(StandardCharsets.UTF_8));
    }

    private static MockMultipartFile xlsx(String fixture) throws IOException {
        Path file = Paths.get("src", "test", "resources", "patient-import", fixture);
        return new MockMultipartFile("file", fixture,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", Files.readAllBytes(file));
    }

    /** Maps columns by position and runs the job to completion, the way the worker would. */
    private JobDetail runToCompletion(Long jobId, Map<String, String> mapping, DuplicatePolicy policy) {
        return runToCompletion(jobId, mapping, policy, null);
    }

    private JobDetail runToCompletion(Long jobId, Map<String, String> mapping, DuplicatePolicy policy,
                                      DuplicatePolicy weakPolicy) {
        service.confirmMapping(jobId, new MappingRequest(mapping));
        drain();
        service.confirmImport(jobId, new ConfirmImportRequest(policy, weakPolicy));
        drain();
        return service.get(jobId);
    }

    /**
     * Runs the worker until it has nothing left to do. The worker clears the tenant when it
     * finishes, as it must, so the caller's tenant is put back afterwards — and it is read from the
     * context rather than from this test's own field, because some tests act as a second clinic.
     */
    private void drain() {
        Long caller = TenantContext.get();
        try {
            for (int i = 0; i < 200; i++) {
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

    /** Any job still mid-flight, whoever holds its lease — the test stands in for every worker. */
    private Long runningJobId() {
        return jobRepository.findClaimable(
                        List.of(ImportJobStatus.ANALYSING, ImportJobStatus.IMPORTING),
                        "any-worker",
                        java.time.Instant.now().plusSeconds(60),
                        org.springframework.data.domain.PageRequest.of(0, 1))
                .stream().findFirst().map(PatientImportJob::getId).orElse(null);
    }

    private List<Patient> importedPatients() {
        return patientRepository.findAll().stream()
                .filter(p -> orgId.equals(p.getOrganizationId()))
                .toList();
    }

    private List<RowView> rows(Long jobId, ImportRowStatus status) {
        return service.rows(jobId, List.of(status), 0, 100).content();
    }

    // ----- the happy path --------------------------------------------------------------------

    @Test
    void importsAValidCsvFromUploadThroughToCreatedPatients() {
        UploadResult upload = service.upload(csv("patients.csv", """
                Patient Name,Sex,DOB,Mobile,Old ID
                Sita Rai,F,1990-04-15,9801234567,OLD-1
                Hari Thapa,M,15/01/1974,9841234567,OLD-2
                Gita Sharma,Female,32978,980-111-2222,OLD-3
                """));

        // The header is read and every column recognised without the administrator touching it.
        assertThat(upload.headers()).containsExactly("Patient Name", "Sex", "DOB", "Mobile", "Old ID");
        assertThat(upload.columns()).extracting("suggestedField")
                .containsExactly("FULL_NAME", "GENDER", "DATE_OF_BIRTH", "PHONE", "EXTERNAL_ID");
        assertThat(upload.sampleRows()).hasSize(3);

        JobDetail done = runToCompletion(upload.job().id(),
                Map.of("0", "FULL_NAME", "1", "GENDER", "2", "DATE_OF_BIRTH", "3", "PHONE", "4", "EXTERNAL_ID"),
                DuplicatePolicy.SKIP);

        assertThat(done.job().status()).isEqualTo(ImportJobStatus.COMPLETED);
        assertThat(done.job().totalRows()).isEqualTo(3);
        assertThat(done.job().importedRows()).isEqualTo(3);
        assertThat(done.job().failedRows()).isZero();
        assertThat(done.job().percentComplete()).isEqualTo(100);

        List<Patient> created = importedPatients();
        assertThat(created).hasSize(3);
        Patient sita = created.stream().filter(p -> p.getFullName().equals("Sita Rai")).findFirst().orElseThrow();
        assertThat(sita.getGender()).isEqualTo(Gender.FEMALE);
        assertThat(sita.getDateOfBirth()).isEqualTo(java.time.LocalDate.of(1990, 4, 15));
        assertThat(sita.getPhone()).isEqualTo("9801234567");
        // The clinic's own number is kept for reference; the system still issues its own.
        assertThat(sita.getExternalMrn()).isEqualTo("OLD-1");
        assertThat(sita.getMrn()).startsWith("P").hasSize(7);
        assertThat(sita.getRegistrationChannel()).isEqualTo(RegistrationChannel.IMPORT);

        // Every patient got a distinct number from the clinic's own sequence.
        assertThat(created).extracting(Patient::getMrn).doesNotHaveDuplicates();

        // A date written day-first and one that arrived as an Excel serial both read correctly.
        assertThat(created.stream().filter(p -> p.getFullName().equals("Hari Thapa")).findFirst().orElseThrow()
                .getDateOfBirth()).isEqualTo(java.time.LocalDate.of(1974, 1, 15));
        assertThat(created.stream().filter(p -> p.getFullName().equals("Gita Sharma")).findFirst().orElseThrow()
                .getDateOfBirth()).isEqualTo(java.time.LocalDate.of(1990, 4, 15));
    }

    @Test
    void importsARealExcelWorkbookIncludingNepaliTextAndDateCells() throws Exception {
        UploadResult upload = service.upload(xlsx("patients-mixed.xlsx"));
        JobDetail done = runToCompletion(upload.job().id(),
                Map.of("0", "FULL_NAME", "1", "GENDER", "2", "DATE_OF_BIRTH", "3", "PHONE", "5", "EXTERNAL_ID",
                        "6", "ADDRESS_LINE"),
                DuplicatePolicy.SKIP);

        assertThat(done.job().status()).isEqualTo(ImportJobStatus.COMPLETED);
        List<Patient> created = importedPatients();

        Patient nepali = created.stream().filter(p -> p.getFullName().equals("सीता राई")).findFirst().orElseThrow();
        assertThat(nepali.getGender()).isEqualTo(Gender.FEMALE);
        assertThat(nepali.getAddress().getLine()).isEqualTo("काठमाडौं");

        Patient sita = created.stream().filter(p -> p.getFullName().equals("Sita Rai")).findFirst().orElseThrow();
        assertThat(sita.getDateOfBirth()).isEqualTo(java.time.LocalDate.of(1990, 4, 15));
    }

    // ----- validation ------------------------------------------------------------------------

    @Test
    void reportsEveryBadRowWithItsLineNumberFieldAndReasonAndImportsTheRest() {
        UploadResult upload = service.upload(csv("mixed.csv", """
                Name,Gender,DOB,Phone,Email
                Good Patient,M,1990-01-01,9800000001,good@example.com
                ,F,1990-01-01,9800000002,
                No Gender,,1990-01-01,9800000003,
                Bad Date,M,not-a-date,9800000004,
                Bad Email,F,1990-01-01,9800000005,not-an-email
                No Age Or Dob,M,,9800000006,
                """));

        JobDetail done = runToCompletion(upload.job().id(),
                Map.of("0", "FULL_NAME", "1", "GENDER", "2", "DATE_OF_BIRTH", "3", "PHONE", "4", "EMAIL"),
                DuplicatePolicy.SKIP);

        assertThat(done.job().totalRows()).isEqualTo(6);
        assertThat(done.job().importedRows()).isEqualTo(1);
        assertThat(done.job().invalidRows()).isEqualTo(5);

        List<RowView> bad = rows(upload.job().id(), ImportRowStatus.INVALID);
        assertThat(bad).hasSize(5);
        // The line number is the one the administrator sees in Excel, header included.
        assertThat(bad).extracting(RowView::rowNumber).containsExactly(3, 4, 5, 6, 7);
        assertThat(bad.get(0).errorField()).isEqualTo("FULL_NAME");
        assertThat(bad.get(0).errorMessage()).contains("name is missing");
        assertThat(bad.get(1).errorField()).isEqualTo("GENDER");
        assertThat(bad.get(2).errorField()).isEqualTo("DATE_OF_BIRTH");
        assertThat(bad.get(2).errorMessage()).contains("not a date");
        assertThat(bad.get(3).errorField()).isEqualTo("EMAIL");
        assertThat(bad.get(4).errorMessage()).contains("date of birth or an age");

        // The original values are kept so the report can show them back.
        assertThat(bad.get(2).data()).containsEntry("FULL_NAME", "Bad Date");

        // Nothing invalid reached the database.
        assertThat(importedPatients()).hasSize(1);
    }

    @Test
    void acceptsAnAgeWhenThereIsNoDateOfBirth() {
        UploadResult upload = service.upload(csv("ages.csv", """
                Name,Gender,Age
                Age Only,M,35
                """));
        runToCompletion(upload.job().id(), Map.of("0", "FULL_NAME", "1", "GENDER", "2", "AGE_YEARS"),
                DuplicatePolicy.SKIP);

        Patient created = importedPatients().get(0);
        assertThat(created.getApproximateAgeYears()).isEqualTo(35);
        assertThat(created.getDateOfBirth()).isNull();
    }

    // ----- duplicates ------------------------------------------------------------------------

    @Test
    void findsDuplicatesAgainstTheDatabaseAndSkipsThemByDefault() {
        service.upload(csv("first.csv", "Name,Gender,DOB,Phone\nSita Rai,F,1990-04-15,9801234567\n"));
        Long firstJob = jobRepository.history(orgId, org.springframework.data.domain.PageRequest.of(0, 1))
                .getContent().get(0).getId();
        runToCompletion(firstJob, Map.of("0", "FULL_NAME", "1", "GENDER", "2", "DATE_OF_BIRTH", "3", "PHONE"),
                DuplicatePolicy.SKIP);
        assertThat(importedPatients()).hasSize(1);

        // The same person again, with the phone written differently.
        UploadResult second = service.upload(csv("second.csv", """
                Name,Gender,DOB,Phone
                Sita Rai,F,1990-04-15,980-123-4567
                Brand New,M,1985-02-02,9800000099
                """));
        JobDetail done = runToCompletion(second.job().id(),
                Map.of("0", "FULL_NAME", "1", "GENDER", "2", "DATE_OF_BIRTH", "3", "PHONE"),
                DuplicatePolicy.SKIP);

        assertThat(done.job().duplicateRows()).isEqualTo(1);
        assertThat(done.job().importedRows()).isEqualTo(1);
        assertThat(done.job().skippedRows()).isEqualTo(1);
        // The existing patient is untouched and no second copy was made.
        assertThat(importedPatients()).hasSize(2);

        RowView duplicate = rows(second.job().id(), ImportRowStatus.SKIPPED).get(0);
        assertThat(duplicate.duplicateOfMrn()).isNotNull();
    }

    @Test
    void findsDuplicatesWithinTheFileItselfAndKeepsTheFirst() {
        UploadResult upload = service.upload(csv("repeats.csv", """
                Name,Gender,DOB,Phone
                Sita Rai,F,1990-04-15,9801234567
                Sita Rai,F,1990-04-15,9801234567
                Hari Thapa,M,1974-01-15,9841234567
                """));
        JobDetail done = runToCompletion(upload.job().id(),
                Map.of("0", "FULL_NAME", "1", "GENDER", "2", "DATE_OF_BIRTH", "3", "PHONE"),
                DuplicatePolicy.SKIP);

        // The first copy is imported; the second is flagged against it, not against the database.
        assertThat(done.job().importedRows()).isEqualTo(2);
        assertThat(importedPatients()).hasSize(2);
        List<RowView> skipped = rows(upload.job().id(), ImportRowStatus.SKIPPED);
        assertThat(skipped).hasSize(1);
        assertThat(skipped.get(0).rowNumber()).isEqualTo(3);
        assertThat(skipped.get(0).duplicateOfRow()).isEqualTo(2);
    }

    @Test
    void matchesAnExistingPatientOnTheClinicsOwnIdentifier() {
        service.upload(csv("a.csv", "Name,Gender,Age,Old ID\nOriginal Name,M,40,OLD-77\n"));
        Long first = jobRepository.history(orgId, org.springframework.data.domain.PageRequest.of(0, 1))
                .getContent().get(0).getId();
        runToCompletion(first, Map.of("0", "FULL_NAME", "1", "GENDER", "2", "AGE_YEARS", "3", "EXTERNAL_ID"),
                DuplicatePolicy.SKIP);

        // A different name and phone, but the same clinic-issued ID: the strongest signal there is.
        UploadResult second = service.upload(csv("b.csv", "Name,Gender,Age,Old ID\nRenamed Person,M,41,old-77\n"));
        JobDetail done = runToCompletion(second.job().id(),
                Map.of("0", "FULL_NAME", "1", "GENDER", "2", "AGE_YEARS", "3", "EXTERNAL_ID"),
                DuplicatePolicy.SKIP);

        assertThat(done.job().duplicateRows()).isEqualTo(1);
        assertThat(importedPatients()).hasSize(1);
    }

    @Test
    void createsASecondRecordOnlyWhenTheAdministratorAsksFor() {
        service.upload(csv("a.csv", "Name,Gender,Age,Phone\nSita Rai,F,34,9801234567\n"));
        Long first = jobRepository.history(orgId, org.springframework.data.domain.PageRequest.of(0, 1))
                .getContent().get(0).getId();
        runToCompletion(first, Map.of("0", "FULL_NAME", "1", "GENDER", "2", "AGE_YEARS", "3", "PHONE"),
                DuplicatePolicy.SKIP);

        UploadResult second = service.upload(csv("b.csv", "Name,Gender,Age,Phone\nSita Rai,F,34,9801234567\n"));
        JobDetail done = runToCompletion(second.job().id(),
                Map.of("0", "FULL_NAME", "1", "GENDER", "2", "AGE_YEARS", "3", "PHONE"),
                DuplicatePolicy.IMPORT_AS_NEW);

        assertThat(done.job().importedRows()).isEqualTo(1);
        assertThat(importedPatients()).hasSize(2);
    }

    @Test
    void fillsBlanksOnAnExistingPatientButNeverOverwritesWhatIsAlreadyThere() {
        service.upload(csv("a.csv", "Name,Gender,Age,Phone\nSita Rai,F,34,9801234567\n"));
        Long first = jobRepository.history(orgId, org.springframework.data.domain.PageRequest.of(0, 1))
                .getContent().get(0).getId();
        runToCompletion(first, Map.of("0", "FULL_NAME", "1", "GENDER", "2", "AGE_YEARS", "3", "PHONE"),
                DuplicatePolicy.SKIP);
        Patient before = importedPatients().get(0);
        assertThat(before.getEmail()).isNull();

        // Same patient, now with an email and a DIFFERENT phone number.
        UploadResult second = service.upload(csv("b.csv",
                "Name,Gender,Age,Phone,Email\nSita Rai,F,34,9801234567,sita@example.com\n"));
        JobDetail done = runToCompletion(second.job().id(),
                Map.of("0", "FULL_NAME", "1", "GENDER", "2", "AGE_YEARS", "3", "PHONE", "4", "EMAIL"),
                DuplicatePolicy.FILL_BLANKS);

        assertThat(done.job().updatedRows()).isEqualTo(1);
        assertThat(importedPatients()).hasSize(1);
        Patient after = importedPatients().get(0);
        // The blank was filled...
        assertThat(after.getEmail()).isEqualTo("sita@example.com");
        // ...and what was already there was left alone.
        assertThat(after.getPhone()).isEqualTo("9801234567");
        assertThat(after.getFullName()).isEqualTo("Sita Rai");
    }

    // ----- possible matches ------------------------------------------------------------------

    @Test
    void flagsANameGenderAndAgeMatchForReviewInsteadOfPassingItSilently() {
        service.upload(csv("a.csv", "Name,Gender,Age\nRam Thapa,M,40\n"));
        Long first = jobRepository.history(orgId, org.springframework.data.domain.PageRequest.of(0, 1))
                .getContent().get(0).getId();
        runToCompletion(first, Map.of("0", "FULL_NAME", "1", "GENDER", "2", "AGE_YEARS"), DuplicatePolicy.SKIP);

        // No phone, no ID, no date of birth: nothing firm, but the same name, gender and age.
        UploadResult second = service.upload(csv("b.csv", "Name,Gender,Age\nRam Thapa,M,41\n"));
        service.confirmMapping(second.job().id(),
                new MappingRequest(Map.of("0", "FULL_NAME", "1", "GENDER", "2", "AGE_YEARS")));
        drain();

        JobDetail checked = service.get(second.job().id());
        assertThat(checked.job().possibleDuplicateRows()).isEqualTo(1);
        assertThat(checked.job().duplicateRows()).isZero();
        RowView row = rows(second.job().id(), ImportRowStatus.POSSIBLE_DUPLICATE).get(0);
        assertThat(row.duplicateOfMrn()).isEqualTo("P000001");
        assertThat(row.duplicateReason()).contains("Same name, gender and age");
    }

    @Test
    void importsAPossibleMatchAsNewByDefaultAndSkipsItOnRequest() {
        service.upload(csv("a.csv", "Name,Gender,Age\nRam Thapa,M,40\n"));
        Long first = jobRepository.history(orgId, org.springframework.data.domain.PageRequest.of(0, 1))
                .getContent().get(0).getId();
        runToCompletion(first, Map.of("0", "FULL_NAME", "1", "GENDER", "2", "AGE_YEARS"), DuplicatePolicy.SKIP);

        // Default: a shared common name is probably someone else, so it goes in.
        UploadResult asNew = service.upload(csv("b.csv", "Name,Gender,Age\nRam Thapa,M,40\n"));
        JobDetail done = runToCompletion(asNew.job().id(),
                Map.of("0", "FULL_NAME", "1", "GENDER", "2", "AGE_YEARS"), DuplicatePolicy.SKIP, null);
        assertThat(done.job().importedRows()).isEqualTo(1);
        assertThat(importedPatients()).hasSize(2);

        // Asked to skip possible matches, it stays out.
        UploadResult skipped = service.upload(csv("c.csv", "Name,Gender,Age\nRam Thapa,M,40\n"));
        JobDetail done2 = runToCompletion(skipped.job().id(),
                Map.of("0", "FULL_NAME", "1", "GENDER", "2", "AGE_YEARS"), DuplicatePolicy.SKIP,
                DuplicatePolicy.SKIP);
        assertThat(done2.job().importedRows()).isZero();
        assertThat(done2.job().skippedRows()).isEqualTo(1);
        assertThat(importedPatients()).hasSize(2);
    }

    @Test
    void aDifferentGenderOrAgeIsNotAPossibleMatch() {
        service.upload(csv("a.csv", "Name,Gender,Age\nRam Thapa,M,40\n"));
        Long first = jobRepository.history(orgId, org.springframework.data.domain.PageRequest.of(0, 1))
                .getContent().get(0).getId();
        runToCompletion(first, Map.of("0", "FULL_NAME", "1", "GENDER", "2", "AGE_YEARS"), DuplicatePolicy.SKIP);

        UploadResult second = service.upload(csv("b.csv", """
                Name,Gender,Age
                Ram Thapa,F,40
                Ram Thapa,M,55
                """));
        service.confirmMapping(second.job().id(),
                new MappingRequest(Map.of("0", "FULL_NAME", "1", "GENDER", "2", "AGE_YEARS")));
        drain();
        JobDetail checked = service.get(second.job().id());
        assertThat(checked.job().possibleDuplicateRows()).isZero();
        assertThat(checked.job().validRows()).isEqualTo(2);
    }

    @Test
    void twoCopiesOfANameOnlyPersonInOneFileAreStillCaughtAsARepeat() {
        service.upload(csv("a.csv", "Name,Gender,Age\nRam Thapa,M,40\n"));
        Long first = jobRepository.history(orgId, org.springframework.data.domain.PageRequest.of(0, 1))
                .getContent().get(0).getId();
        runToCompletion(first, Map.of("0", "FULL_NAME", "1", "GENDER", "2", "AGE_YEARS"), DuplicatePolicy.SKIP);

        // Both rows resemble the existing patient, AND the second repeats the first. Under the
        // default policy the first may go in as new; the second must not go in as well.
        UploadResult second = service.upload(csv("b.csv", """
                Name,Gender,DOB
                Ram Thapa,M,1986-05-05
                Ram Thapa,M,1986-05-05
                """));
        JobDetail done = runToCompletion(second.job().id(),
                Map.of("0", "FULL_NAME", "1", "GENDER", "2", "DATE_OF_BIRTH"), DuplicatePolicy.SKIP, null);
        assertThat(done.job().importedRows()).isEqualTo(1);
        assertThat(importedPatients()).hasSize(2);
        assertThat(rows(second.job().id(), ImportRowStatus.SKIPPED).get(0).duplicateOfRow()).isEqualTo(2);
    }

    @Test
    void aRowWithAPhoneThatMatchedNobodyIsNotAPossibleMatch() {
        service.upload(csv("a.csv", "Name,Gender,Age,Phone\nRam Thapa,M,40,9800000001\n"));
        Long first = jobRepository.history(orgId, org.springframework.data.domain.PageRequest.of(0, 1))
                .getContent().get(0).getId();
        runToCompletion(first, Map.of("0", "FULL_NAME", "1", "GENDER", "2", "AGE_YEARS", "3", "PHONE"),
                DuplicatePolicy.SKIP);

        // Same name, gender and age, but a different phone: evidence of a different person.
        UploadResult second = service.upload(csv("b.csv", "Name,Gender,Age,Phone\nRam Thapa,M,40,9800000002\n"));
        service.confirmMapping(second.job().id(),
                new MappingRequest(Map.of("0", "FULL_NAME", "1", "GENDER", "2", "AGE_YEARS", "3", "PHONE")));
        drain();
        JobDetail checked = service.get(second.job().id());
        assertThat(checked.job().possibleDuplicateRows()).isZero();
        assertThat(checked.job().validRows()).isEqualTo(1);
    }

    @Test
    void fillingBlanksFromAPossibleMatchCompletesTheMatchedPatient() {
        service.upload(csv("a.csv", "Name,Gender,Age\nRam Thapa,M,40\n"));
        Long first = jobRepository.history(orgId, org.springframework.data.domain.PageRequest.of(0, 1))
                .getContent().get(0).getId();
        runToCompletion(first, Map.of("0", "FULL_NAME", "1", "GENDER", "2", "AGE_YEARS"), DuplicatePolicy.SKIP);

        UploadResult second = service.upload(csv("b.csv", "Name,Gender,Age,Email\nRam Thapa,M,40,ram@example.com\n"));
        JobDetail done = runToCompletion(second.job().id(),
                Map.of("0", "FULL_NAME", "1", "GENDER", "2", "AGE_YEARS", "3", "EMAIL"),
                DuplicatePolicy.SKIP, DuplicatePolicy.FILL_BLANKS);
        assertThat(done.job().updatedRows()).isEqualTo(1);
        assertThat(done.job().importedRows()).isZero();
        assertThat(importedPatients()).hasSize(1);
        assertThat(importedPatients().get(0).getEmail()).isEqualTo("ram@example.com");
    }

    @Test
    void fillBlanksDoesNotTouchARecordThatOnlySharesAPhoneWithADifferentName() {
        service.upload(csv("a.csv", "Name,Gender,Age,Phone\nSita Rai,F,34,9801234567\n"));
        Long first = jobRepository.history(orgId, org.springframework.data.domain.PageRequest.of(0, 1))
                .getContent().get(0).getId();
        runToCompletion(first, Map.of("0", "FULL_NAME", "1", "GENDER", "2", "AGE_YEARS", "3", "PHONE"),
                DuplicatePolicy.SKIP);

        // Her husband, on the household phone. Filling her record from his row would mix them up.
        UploadResult second = service.upload(csv("b.csv",
                "Name,Gender,Age,Phone,Email\nRam Rai,M,38,9801234567,ram@example.com\n"));
        JobDetail done = runToCompletion(second.job().id(),
                Map.of("0", "FULL_NAME", "1", "GENDER", "2", "AGE_YEARS", "3", "PHONE", "4", "EMAIL"),
                DuplicatePolicy.FILL_BLANKS, null);
        assertThat(done.job().updatedRows()).isZero();
        assertThat(done.job().skippedRows()).isEqualTo(1);
        assertThat(importedPatients().get(0).getEmail()).isNull();
        assertThat(rows(second.job().id(), ImportRowStatus.SKIPPED).get(0).errorMessage()).contains("different name");
    }

    @Test
    void aBatchMixingSkipsAndCreatesLeavesNoGapInThePatientNumbers() {
        service.upload(csv("a.csv", "Name,Gender,Age,Phone\nKnown One,M,30,9800000001\n"));
        Long first = jobRepository.history(orgId, org.springframework.data.domain.PageRequest.of(0, 1))
                .getContent().get(0).getId();
        runToCompletion(first, Map.of("0", "FULL_NAME", "1", "GENDER", "2", "AGE_YEARS", "3", "PHONE"),
                DuplicatePolicy.SKIP);

        // Batches of two: [new, known-skip] then [new, new] then [new]. Every reserved number
        // that goes unused must come back, or P000003 would be missing.
        UploadResult second = service.upload(csv("b.csv", """
                Name,Gender,Age,Phone
                New A,M,30,9800000011
                Known One,M,30,9800000001
                New B,F,31,9800000012
                New C,M,32,9800000013
                New D,F,33,9800000014
                """));
        runToCompletion(second.job().id(),
                Map.of("0", "FULL_NAME", "1", "GENDER", "2", "AGE_YEARS", "3", "PHONE"), DuplicatePolicy.SKIP);
        assertThat(importedPatients().stream().map(Patient::getMrn).sorted().toList())
                .containsExactly("P000001", "P000002", "P000003", "P000004", "P000005");
    }

    @Test
    void aRowThatFailsInsideTheDatabaseWriteIsReportedWithoutFailingTheJob() {
        // A patient number the sequence does not know about, placed where the third create will
        // land: the INSERT itself then fails on the unique constraint, which poisons the batch's
        // transaction in a way no per-row catch can see.
        patientRepository.save(np.com.lims.patient.entity.Patient.register("P000003", "Squatter", Gender.MALE));

        UploadResult upload = service.upload(csv("poison.csv", """
                Name,Gender,Age
                Fine One,M,30
                Fine Two,F,31
                Unlucky Three,M,32
                """));
        JobDetail done = runToCompletion(upload.job().id(),
                Map.of("0", "FULL_NAME", "1", "GENDER", "2", "AGE_YEARS"), DuplicatePolicy.SKIP);

        assertThat(done.job().status()).isEqualTo(ImportJobStatus.COMPLETED);
        assertThat(done.job().importedRows()).isEqualTo(2);
        assertThat(done.job().failedRows()).isEqualTo(1);
        RowView failedRow = rows(upload.job().id(), ImportRowStatus.FAILED).get(0);
        assertThat(failedRow.rowNumber()).isEqualTo(4);
        assertThat(failedRow.errorMessage()).contains("Could not be saved to the database");
        // The two good rows exist exactly once; nothing was created twice by the retry.
        assertThat(importedPatients().stream().filter(p -> !p.getFullName().equals("Squatter")))
                .extracting(Patient::getFullName).containsExactlyInAnyOrder("Fine One", "Fine Two");
    }

    @Test
    void theBatchDrawsItsPatientNumbersOnceAndTheyStayContiguous() {
        StringBuilder many = new StringBuilder("Name,Gender,Age" + System.lineSeparator());
        for (int i = 1; i <= 7; i++) {
            many.append("Block ").append(i).append(",M,30").append(System.lineSeparator());
        }
        UploadResult upload = service.upload(csv("block.csv", many.toString()));
        runToCompletion(upload.job().id(), Map.of("0", "FULL_NAME", "1", "GENDER", "2", "AGE_YEARS"),
                DuplicatePolicy.SKIP);
        // Batches of two: four blocks, no number skipped between them.
        assertThat(importedPatients().stream().map(Patient::getMrn).sorted().toList())
                .containsExactly("P000001", "P000002", "P000003", "P000004", "P000005", "P000006", "P000007");
    }

    // ----- mapping ---------------------------------------------------------------------------

    @Test
    void suggestsFieldsForUnfamiliarHeaderNames() {
        UploadResult upload = service.upload(csv("odd-headers.csv",
                "Client Name,Sex,Birth Date,Contact Number,Home Address\nA,M,1990-01-01,9800000001,Somewhere\n"));
        assertThat(upload.columns()).extracting("suggestedField")
                .containsExactly("FULL_NAME", "GENDER", "DATE_OF_BIRTH", "PHONE", "ADDRESS_LINE");
    }

    @Test
    void refusesAMappingThatLeavesARequiredFieldUnmapped() {
        UploadResult upload = service.upload(csv("x.csv", "A,B\nSita,F\n"));
        assertThatThrownBy(() -> service.confirmMapping(upload.job().id(),
                new MappingRequest(Map.of("0", "FULL_NAME"))))
                .hasMessageContaining("Gender");
    }

    @Test
    void refusesToFeedOnePatientFieldFromTwoColumns() {
        UploadResult upload = service.upload(csv("x.csv", "Name,Also Name,Gender,Age\nSita,Sita,F,30\n"));
        assertThatThrownBy(() -> service.confirmMapping(upload.job().id(),
                new MappingRequest(Map.of("0", "FULL_NAME", "1", "FULL_NAME", "2", "GENDER", "3", "AGE_YEARS"))))
                .hasMessageContaining("two different columns");
    }

    @Test
    void refusesAMappingWithNeitherDateOfBirthNorAge() {
        UploadResult upload = service.upload(csv("x.csv", "Name,Gender\nSita,F\n"));
        assertThatThrownBy(() -> service.confirmMapping(upload.job().id(),
                new MappingRequest(Map.of("0", "FULL_NAME", "1", "GENDER"))))
                .hasMessageContaining("Date of Birth or Age");
    }

    @Test
    void doesNotSuggestTheSameFieldForTwoColumns() {
        // Both headers mean the name; only one may be mapped automatically.
        UploadResult upload = service.upload(csv("x.csv", "Patient Name,Full Name,Gender,Age\nA,A,M,30\n"));
        List<String> suggested = upload.columns().stream().map(c -> c.suggestedField()).toList();
        assertThat(suggested.stream().filter("FULL_NAME"::equals)).hasSize(1);
    }

    // ----- files -----------------------------------------------------------------------------

    @Test
    void refusesFileTypesItCannotRead() {
        assertThatThrownBy(() -> service.upload(
                new MockMultipartFile("file", "patients.pdf", "application/pdf", "x".getBytes())))
                .hasMessageContaining("Excel (.xlsx) and CSV");
        // The old binary format gets a message saying exactly what to do about it.
        assertThatThrownBy(() -> service.upload(
                new MockMultipartFile("file", "patients.xls", "application/vnd.ms-excel", "x".getBytes())))
                .hasMessageContaining("Save As");
    }

    @Test
    void refusesAnEmptyFile() {
        assertThatThrownBy(() -> service.upload(csv("empty.csv", "")))
                .hasMessageContaining("empty");
    }

    @Test
    void refusesAFileWithAHeaderAndNoRows() {
        UploadResult upload = service.upload(csv("header-only.csv", "Name,Gender,Age\n"));
        service.confirmMapping(upload.job().id(),
                new MappingRequest(Map.of("0", "FULL_NAME", "1", "GENDER", "2", "AGE_YEARS")));
        drain();
        JobDetail done = service.get(upload.job().id());
        assertThat(done.job().status()).isEqualTo(ImportJobStatus.FAILED);
        assertThat(done.job().failureMessage()).contains("no patient rows");
    }

    @Test
    void noticesTheSameFileBeingUploadedTwice() {
        String body = "Name,Gender,Age\nSita,F,30\n";
        service.upload(csv("patients.csv", body));
        UploadResult again = service.upload(csv("patients.csv", body));
        assertThat(again.sameFileAs()).isNotNull();
    }

    // ----- interruption and retry ------------------------------------------------------------

    @Test
    void anInterruptedImportResumesWithoutCreatingAnyPatientTwice() {
        UploadResult upload = service.upload(csv("many.csv", """
                Name,Gender,Age
                P1,M,30
                P2,F,31
                P3,M,32
                P4,F,33
                P5,M,34
                """));
        service.confirmMapping(upload.job().id(),
                new MappingRequest(Map.of("0", "FULL_NAME", "1", "GENDER", "2", "AGE_YEARS")));
        drain();
        service.confirmImport(upload.job().id(), new ConfirmImportRequest(DuplicatePolicy.SKIP, null));

        // One tick of the worker, then stop as though the server were killed mid-import.
        worker.pump();
        TenantContext.set(orgId);
        int afterInterruption = importedPatients().size();
        assertThat(afterInterruption).isPositive().isLessThanOrEqualTo(5);

        // A new worker picks the job up and finishes it.
        drain();
        JobDetail done = service.get(upload.job().id());
        assertThat(done.job().status()).isEqualTo(ImportJobStatus.COMPLETED);
        assertThat(done.job().importedRows()).isEqualTo(5);
        // Five rows, five patients — the rows already done were not done again.
        assertThat(importedPatients()).hasSize(5);
        assertThat(importedPatients()).extracting(Patient::getFullName).doesNotHaveDuplicates();
    }

    @Test
    void cancellingStopsTheImportAndKeepsWhatWasAlreadyCreated() {
        // Batch size is 2 and a tick runs 10 batches, so the file needs more than 20 rows for a
        // cancellation to have anything left to stop.
        StringBuilder many = new StringBuilder("Name,Gender,Age" + System.lineSeparator());
        for (int i = 1; i <= 60; i++) {
            many.append("C").append(i).append(",M,30").append(System.lineSeparator());
        }
        UploadResult upload = service.upload(csv("many.csv", many.toString()));
        service.confirmMapping(upload.job().id(),
                new MappingRequest(Map.of("0", "FULL_NAME", "1", "GENDER", "2", "AGE_YEARS")));
        drain();
        service.confirmImport(upload.job().id(), new ConfirmImportRequest(DuplicatePolicy.SKIP, null));

        worker.pump();
        TenantContext.set(orgId);
        int created = importedPatients().size();

        service.cancel(upload.job().id());
        drain();

        JobDetail done = service.get(upload.job().id());
        assertThat(done.job().status()).isEqualTo(ImportJobStatus.CANCELLED);
        // Patients already created are real records and are kept.
        assertThat(importedPatients()).hasSize(created);
        // No row is left looking unfinished.
        assertThat(rows(upload.job().id(), ImportRowStatus.VALID)).isEmpty();
    }

    @Test
    void retryingACorrectedFileDoesNotReimportWhatAlreadyWentIn() {
        UploadResult first = service.upload(csv("bad.csv", """
                Name,Gender,Age,Phone
                Fine Patient,M,30,9800000011
                ,F,31,9800000012
                """));
        runToCompletion(first.job().id(),
                Map.of("0", "FULL_NAME", "1", "GENDER", "2", "AGE_YEARS", "3", "PHONE"),
                DuplicatePolicy.SKIP);
        assertThat(importedPatients()).hasSize(1);

        // The administrator fixes the bad row and uploads the whole file again.
        UploadResult retry = service.retry(first.job().id(), csv("fixed.csv", """
                Name,Gender,Age,Phone
                Fine Patient,M,30,9800000011
                Now Named,F,31,9800000012
                """));
        JobDetail done = runToCompletion(retry.job().id(),
                Map.of("0", "FULL_NAME", "1", "GENDER", "2", "AGE_YEARS", "3", "PHONE"),
                DuplicatePolicy.SKIP);

        // The row that already went in is recognised as a duplicate; only the corrected one is new.
        assertThat(done.job().importedRows()).isEqualTo(1);
        assertThat(importedPatients()).hasSize(2);
        assertThat(jobRepository.findById(retry.job().id()).orElseThrow().getRetryOfJobId())
                .isEqualTo(first.job().id());
    }

    @Test
    void refusesToStartASecondImportWhileOneIsRunning() {
        UploadResult first = service.upload(csv("a.csv", "Name,Gender,Age\nA,M,30\n"));
        service.confirmMapping(first.job().id(),
                new MappingRequest(Map.of("0", "FULL_NAME", "1", "GENDER", "2", "AGE_YEARS")));

        assertThatThrownBy(() -> service.upload(csv("b.csv", "Name,Gender,Age\nB,F,31\n")))
                .hasMessageContaining("already running");
        drain();
    }

    // ----- leases ----------------------------------------------------------------------------

    @Test
    void aJobAnotherWorkerIsActivelyRunningIsLeftAlone() {
        UploadResult upload = service.upload(csv("held.csv",
                "Name,Gender,Age" + System.lineSeparator() + "Held,M,30" + System.lineSeparator()));
        service.confirmMapping(upload.job().id(),
                new MappingRequest(Map.of("0", "FULL_NAME", "1", "GENDER", "2", "AGE_YEARS")));

        // Another server took this job a moment ago and is still reporting in.
        PatientImportJob job = jobRepository.findById(upload.job().id()).orElseThrow();
        job.claim("other-server:999");
        jobRepository.saveAndFlush(job);

        worker.pump();
        TenantContext.set(orgId);
        PatientImportJob after = jobRepository.findById(upload.job().id()).orElseThrow();
        assertThat(after.getStatus()).isEqualTo(ImportJobStatus.ANALYSING);
        assertThat(after.getClaimedBy()).isEqualTo("other-server:999");
        assertThat(after.getTotalRows()).isZero();

        // Once that server stops reporting in, the job is fair game.
        after.claim("other-server:999");
        java.lang.reflect.Field field;
        try {
            field = PatientImportJob.class.getDeclaredField("heartbeatAt");
            field.setAccessible(true);
            field.set(after, java.time.Instant.now().minus(java.time.Duration.ofHours(1)));
        } catch (ReflectiveOperationException e) {
            throw new AssertionError(e);
        }
        jobRepository.saveAndFlush(after);
        drain();
        assertThat(jobRepository.findById(upload.job().id()).orElseThrow().getStatus())
                .isEqualTo(ImportJobStatus.READY);
    }

    // ----- tenancy ---------------------------------------------------------------------------

    @Test
    void oneClinicsImportIsInvisibleToAnother() {
        UploadResult mine = service.upload(csv("mine.csv", "Name,Gender,Age\nMy Patient,M,30\n"));
        runToCompletion(mine.job().id(), Map.of("0", "FULL_NAME", "1", "GENDER", "2", "AGE_YEARS"),
                DuplicatePolicy.SKIP);

        Long otherOrg = organizations.save(Organization.create("other-" + System.nanoTime(), "Other")).getId();
        TenantContext.set(otherOrg);
        laboratoryProfiles.ensureProvisioned(otherOrg, "Other");

        // The other clinic sees neither the job nor its rows.
        assertThat(service.history(0, 50).content()).isEmpty();
        assertThatThrownBy(() -> service.get(mine.job().id())).hasMessageContaining("not found");

        // And a patient with the same details is not a duplicate across clinics.
        UploadResult theirs = service.upload(csv("theirs.csv", "Name,Gender,Age\nMy Patient,M,30\n"));
        JobDetail done = runToCompletion(theirs.job().id(),
                Map.of("0", "FULL_NAME", "1", "GENDER", "2", "AGE_YEARS"), DuplicatePolicy.SKIP);
        assertThat(done.job().duplicateRows()).isZero();
        assertThat(done.job().importedRows()).isEqualTo(1);

        TenantContext.set(orgId);
        assertThat(importedPatients()).hasSize(1);
    }

    @Test
    void ignoresAnOrganizationColumnInTheUploadedFile() {
        // A spreadsheet cannot choose which clinic its patients belong to.
        UploadResult upload = service.upload(csv("sneaky.csv",
                "Name,Gender,Age,organization_id\nSneaky,M,30,999999\n"));
        runToCompletion(upload.job().id(), Map.of("0", "FULL_NAME", "1", "GENDER", "2", "AGE_YEARS"),
                DuplicatePolicy.SKIP);
        assertThat(importedPatients()).hasSize(1);
        assertThat(importedPatients().get(0).getOrganizationId()).isEqualTo(orgId);
    }

    // ----- ordinary registration keeps working -----------------------------------------------

    @Test
    void theClinicsPatientNumberingContinuesCorrectlyAfterAnImport() {
        UploadResult upload = service.upload(csv("seed.csv", """
                Name,Gender,Age
                N1,M,30
                N2,F,31
                N3,M,32
                """));
        runToCompletion(upload.job().id(), Map.of("0", "FULL_NAME", "1", "GENDER", "2", "AGE_YEARS"),
                DuplicatePolicy.SKIP);

        List<String> mrns = importedPatients().stream().map(Patient::getMrn).sorted().toList();
        assertThat(mrns).containsExactly("P000001", "P000002", "P000003");

        // A patient registered at the desk afterwards continues the same sequence.
        UploadResult next = service.upload(csv("next.csv", "Name,Gender,Age\nN4,F,33\n"));
        runToCompletion(next.job().id(), Map.of("0", "FULL_NAME", "1", "GENDER", "2", "AGE_YEARS"),
                DuplicatePolicy.SKIP);
        assertThat(importedPatients().stream().map(Patient::getMrn).sorted().toList())
                .containsExactly("P000001", "P000002", "P000003", "P000004");
    }

    // ----- reports ---------------------------------------------------------------------------

    @Test
    void theErrorReportCarriesTheOriginalRowDataAndReason() {
        UploadResult upload = service.upload(csv("bad.csv", """
                Name,Gender,DOB
                Good,M,1990-01-01
                Bad Row,M,rubbish
                """));
        runToCompletion(upload.job().id(), Map.of("0", "FULL_NAME", "1", "GENDER", "2", "DATE_OF_BIRTH"),
                DuplicatePolicy.SKIP);

        String csv = ImportCsvWriter.report(rows(upload.job().id(), ImportRowStatus.INVALID), true);
        assertThat(csv).contains("Row").contains("Bad Row").contains("rubbish").contains("Date of Birth");
        // Excel reads UTF-8 correctly only with the byte-order mark.
        assertThat(csv).startsWith("﻿");
    }

    @Test
    void theTemplateNamesEveryFieldAndMarksTheRequiredOnes() {
        String template = ImportCsvWriter.template();
        assertThat(template).contains("Full Name *").contains("Gender *");
        assertThat(template).contains("Date of Birth").contains("Existing Patient ID");
        assertThat(template).contains("HOW TO USE THIS TEMPLATE");
        assertThat(template).startsWith("﻿");
    }

    @Test
    void aFormulaInACellCannotBecomeAFormulaInTheReport() {
        UploadResult upload = service.upload(csv("inject.csv", """
                Name,Gender,DOB
                =cmd|'/c calc'!A1,M,rubbish
                """));
        runToCompletion(upload.job().id(), Map.of("0", "FULL_NAME", "1", "GENDER", "2", "DATE_OF_BIRTH"),
                DuplicatePolicy.SKIP);
        String csv = ImportCsvWriter.report(rows(upload.job().id(), ImportRowStatus.INVALID), true);
        // Prefixed so the spreadsheet treats it as text when the report is opened.
        assertThat(csv).contains("'=cmd");
    }
}
