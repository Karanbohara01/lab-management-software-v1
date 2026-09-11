package np.com.lims.config;

import np.com.lims.catalog.LabTestRepository;
import np.com.lims.catalog.entity.LabTest;
import np.com.lims.catalog.entity.ParameterDataType;
import np.com.lims.catalog.entity.RangeGender;
import np.com.lims.catalog.entity.SpecimenType;
import np.com.lims.catalog.entity.TestParameter;
import np.com.lims.common.sequence.SequenceService;
import np.com.lims.department.DepartmentRepository;
import np.com.lims.department.entity.Department;
import np.com.lims.doctor.DoctorRepository;
import np.com.lims.doctor.entity.Doctor;
import np.com.lims.patient.PatientRepository;
import np.com.lims.patient.entity.Gender;
import np.com.lims.patient.entity.Patient;
import np.com.lims.rbac.entity.Role;
import np.com.lims.rbac.entity.RoleName;
import np.com.lims.rbac.repository.RoleRepository;
import np.com.lims.user.entity.User;
import np.com.lims.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Development-only seed data. Never runs outside the {@code local} / {@code dev} profiles.
 * All seed user accounts share the password {@code Passw0rd!}. This is DEV DATA, not production data.
 */
@Component
@Profile({"local", "dev"})
public class DevDataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DevDataSeeder.class);
    private static final String DEV_PASSWORD = "Passw0rd!";

    private record SeedUser(String username, String email, String fullName, RoleName role) {}

    private static final List<SeedUser> SEED_USERS = List.of(
            new SeedUser("superadmin", "superadmin@lims.local", "System Administrator", RoleName.SUPER_ADMIN),
            new SeedUser("labadmin", "labadmin@lims.local", "Laboratory Administrator", RoleName.LAB_ADMINISTRATOR),
            new SeedUser("reception", "reception@lims.local", "Front Desk", RoleName.RECEPTIONIST),
            new SeedUser("technician", "technician@lims.local", "Lab Technician", RoleName.LAB_TECHNICIAN),
            new SeedUser("pathologist", "pathologist@lims.local", "Consultant Pathologist", RoleName.PATHOLOGIST),
            new SeedUser("accountant", "accountant@lims.local", "Accounts Officer", RoleName.ACCOUNTANT),
            new SeedUser("collector", "collector@lims.local", "Sample Collection Staff", RoleName.SAMPLE_COLLECTION_STAFF)
    );

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final SequenceService sequenceService;
    private final DepartmentRepository departmentRepository;
    private final LabTestRepository labTestRepository;

    /** Set {@code lims.dev.seed.enabled=false} (e.g. in application-local.yml) to start with an empty catalog. */
    @Value("${lims.dev.seed.enabled:true}")
    private boolean seedEnabled;

    public DevDataSeeder(UserRepository userRepository,
                         RoleRepository roleRepository,
                         PasswordEncoder passwordEncoder,
                         DoctorRepository doctorRepository,
                         PatientRepository patientRepository,
                         SequenceService sequenceService,
                         DepartmentRepository departmentRepository,
                         LabTestRepository labTestRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.doctorRepository = doctorRepository;
        this.patientRepository = patientRepository;
        this.sequenceService = sequenceService;
        this.departmentRepository = departmentRepository;
        this.labTestRepository = labTestRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!seedEnabled) {
            log.warn("DEV SEED: disabled (lims.dev.seed.enabled=false) — leaving the database as-is");
            return;
        }
        seedUsers();
        seedClinical();
        seedCatalog();
    }

    private void seedUsers() {
        String hash = passwordEncoder.encode(DEV_PASSWORD);
        int created = 0;
        for (SeedUser seed : SEED_USERS) {
            if (userRepository.existsByUsernameIgnoreCase(seed.username())) {
                continue;
            }
            Role role = roleRepository.findByName(seed.role())
                    .orElseThrow(() -> new IllegalStateException("Missing baseline role: " + seed.role()));
            User user = User.create(seed.username(), seed.email(), hash, seed.fullName(), null);
            user.addRole(role);
            userRepository.save(user);
            created++;
        }
        if (created > 0) {
            log.warn("DEV SEED: created {} development user account(s) with password '{}'", created, DEV_PASSWORD);
        }
    }

    private void seedClinical() {
        if (doctorRepository.count() > 0 || patientRepository.count() > 0) {
            return;
        }
        Doctor sharma = doctorRepository.save(referrer("Dr. Anjana Sharma", "Internal Medicine", "NMC-11234"));
        Doctor thapa = doctorRepository.save(referrer("Dr. Bikash Thapa", "General Practice", "NMC-20981"));
        doctorRepository.save(referrer("Dr. Sunita Gurung", "Pediatrics", "NMC-30456"));

        registerPatient("Ram Bahadur K.C.", Gender.MALE, 54, "9841000001", sharma);
        registerPatient("Sita Devi Poudel", Gender.FEMALE, 32, "9841000002", thapa);
        registerPatient("Hari Prasad Adhikari", Gender.MALE, 67, "9841000003", null);
        registerPatient("Gita Kumari Rai", Gender.FEMALE, 28, "9841000004", sharma);
        log.warn("DEV SEED: created development doctors and patients");
    }

    private static Doctor referrer(String name, String specialization, String nmc) {
        Doctor d = Doctor.create(name);
        d.update(name, specialization, "MBBS", nmc, null, null, "Community Referral");
        return d;
    }

    private void registerPatient(String name, Gender gender, int age, String phone, Doctor referrer) {
        Patient p = Patient.register(sequenceService.nextFormatted("PATIENT_MRN", "P", 6), name, gender);
        p.applyProfile(null, name, null, gender, null, age, null, null, null, "Nepali", null);
        p.applyContact(phone, null, null, new np.com.lims.patient.entity.Address(), new np.com.lims.patient.entity.Address());
        p.applyReferral(
                referrer != null ? np.com.lims.patient.entity.ReferralSourceType.DOCTOR
                        : np.com.lims.patient.entity.ReferralSourceType.SELF,
                null, referrer);
        patientRepository.save(p);
    }

    private void seedCatalog() {
        if (departmentRepository.count() > 0 || labTestRepository.count() > 0) {
            return;
        }
        Department haem = departmentRepository.save(dept("HAEM", "Hematology"));
        Department biochem = departmentRepository.save(dept("BIOC", "Biochemistry"));
        Department clinpath = departmentRepository.save(dept("CLIN", "Clinical Pathology"));
        Department serology = departmentRepository.save(dept("SERO", "Serology & Immunology"));

        LabTest cbc = LabTest.create("CBC", "Complete Blood Count", haem);
        cbc.updateDetails("Complete Blood Count", haem, "Hematology", SpecimenType.BLOOD_EDTA,
                "3 mL whole blood in EDTA (lavender top)", "Automated cell counter", bd("600.00"), 4);
        numeric(cbc, "HGB", "Haemoglobin", "g/dL", 13, 17, 7, 20);
        numeric(cbc, "WBC", "Total Leukocyte Count", "x10^3/uL", 4, 11, 1, 30);
        numeric(cbc, "PLT", "Platelet Count", "x10^3/uL", 150, 450, 20, 1000);
        numeric(cbc, "HCT", "Haematocrit", "%", 40, 54, null, null);
        labTestRepository.save(cbc);

        LabTest rft = LabTest.create("RFT", "Renal Function Test", biochem);
        rft.updateDetails("Renal Function Test", biochem, "Biochemistry", SpecimenType.BLOOD_SERUM,
                "3 mL serum (gel/clot activator)", "Spectrophotometry", bd("900.00"), 6);
        numeric(rft, "UREA", "Blood Urea", "mg/dL", 15, 45, null, null);
        numeric(rft, "CREA", "Serum Creatinine", "mg/dL", 0.6, 1.3, null, 10);
        numeric(rft, "NA", "Sodium", "mmol/L", 135, 145, 120, 160);
        numeric(rft, "K", "Potassium", "mmol/L", 3.5, 5.1, 2.5, 6.5);
        labTestRepository.save(rft);

        LabTest lipid = LabTest.create("LIPID", "Lipid Profile", biochem);
        lipid.updateDetails("Lipid Profile", biochem, "Biochemistry", SpecimenType.BLOOD_SERUM,
                "3 mL serum, 12-hour fasting", "Enzymatic", bd("1200.00"), 8);
        numeric(lipid, "TC", "Total Cholesterol", "mg/dL", null, 200, null, null);
        numeric(lipid, "TG", "Triglycerides", "mg/dL", null, 150, null, null);
        numeric(lipid, "HDL", "HDL Cholesterol", "mg/dL", 40, null, null, null);
        numeric(lipid, "LDL", "LDL Cholesterol", "mg/dL", null, 100, null, null);
        labTestRepository.save(lipid);

        LabTest urine = LabTest.create("URINE-RM", "Urine Routine & Microscopy", clinpath);
        urine.updateDetails("Urine Routine & Microscopy", clinpath, "Clinical Pathology", SpecimenType.URINE,
                "10 mL mid-stream urine in a clean container", "Dipstick + microscopy", bd("300.00"), 3);
        urine.addParameter("COLOUR", "Colour", null, ParameterDataType.TEXT, 1);
        urine.addParameter("ALB", "Albumin", null, ParameterDataType.CATEGORICAL, 2);
        urine.addParameter("PUS", "Pus Cells", "/hpf", ParameterDataType.TEXT, 3);
        urine.addParameter("RBC", "RBCs", "/hpf", ParameterDataType.TEXT, 4);
        labTestRepository.save(urine);

        LabTest widal = LabTest.create("WIDAL", "Widal Test", serology);
        widal.updateDetails("Widal Test", serology, "Serology", SpecimenType.BLOOD_SERUM,
                "2 mL serum", "Slide agglutination", bd("400.00"), 4);
        widal.addParameter("TO", "S. typhi O", "titre", ParameterDataType.TEXT, 1);
        widal.addParameter("TH", "S. typhi H", "titre", ParameterDataType.TEXT, 2);
        labTestRepository.save(widal);

        log.warn("DEV SEED: created development departments and test catalog");
    }

    private static Department dept(String code, String name) {
        Department d = Department.create(code, name);
        d.update(name, null);
        return d;
    }

    private static void numeric(LabTest test, String code, String name, String unit,
                                Number low, Number high, Number criticalLow, Number criticalHigh) {
        TestParameter p = test.addParameter(code, name, unit, ParameterDataType.NUMERIC, test.getParameters().size() + 1);
        p.addRange(RangeGender.ALL, null, null,
                low == null ? null : bd(low.toString()),
                high == null ? null : bd(high.toString()),
                null,
                criticalLow == null ? null : bd(criticalLow.toString()),
                criticalHigh == null ? null : bd(criticalHigh.toString()));
    }

    private static java.math.BigDecimal bd(String v) {
        return new java.math.BigDecimal(v);
    }
}
