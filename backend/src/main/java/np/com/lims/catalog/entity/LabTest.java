package np.com.lims.catalog.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import np.com.lims.common.audit.BaseEntity;
import np.com.lims.department.entity.Department;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "lab_test")
public class LabTest extends BaseEntity {

    @Column(nullable = false, length = 32, unique = true)
    private String code;

    @Column(nullable = false, length = 160)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "test_type", nullable = false, length = 16)
    private TestType type = TestType.ANALYTE;

    /** How results are entered: PARAMETRIC (value per parameter) or CULTURE (microbiology C&S). */
    @Enumerated(EnumType.STRING)
    @Column(name = "result_mode", nullable = false, length = 16)
    private ResultMode resultMode = ResultMode.PARAMETRIC;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    @Column(length = 80)
    private String category;

    @Enumerated(EnumType.STRING)
    @Column(name = "specimen_type", nullable = false, length = 32)
    private SpecimenType specimenType = SpecimenType.BLOOD_SERUM;

    @Column(name = "specimen_requirements", length = 500)
    private String specimenRequirements;

    @Column(name = "container_type", length = 60)
    private String containerType;

    @Column(name = "min_volume_ml", precision = 6, scale = 2)
    private BigDecimal minVolumeMl;

    @Column(name = "stability_note", length = 300)
    private String stabilityNote;

    @Column(name = "fasting_required", nullable = false)
    private boolean fastingRequired;

    @Column(name = "fasting_hours")
    private Integer fastingHours;

    @Column(name = "is_referral", nullable = false)
    private boolean referral;

    @Column(name = "referral_lab", length = 160)
    private String referralLab;

    @Column(length = 120)
    private String method;

    @Column(name = "loinc_code", length = 20)
    private String loincCode;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price = BigDecimal.ZERO;

    @Column(name = "turnaround_hours")
    private Integer turnaroundHours;

    /** When true, a fully-normal in-range result with no delta breach is verified automatically. */
    @Column(name = "auto_verify_enabled", nullable = false)
    private boolean autoVerifyEnabled;

    @Column(nullable = false)
    private boolean active = true;

    @OneToMany(mappedBy = "test", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("displayOrder ASC, id ASC")
    private List<TestParameter> parameters = new ArrayList<>();

    @OneToMany(mappedBy = "profile", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("displayOrder ASC, id ASC")
    @org.hibernate.annotations.BatchSize(size = 30)
    private List<TestProfileMember> profileMembers = new ArrayList<>();

    protected LabTest() {
    }

    public static LabTest create(String code, String name, Department department) {
        LabTest t = new LabTest();
        t.code = code;
        t.name = name;
        t.department = department;
        t.active = true;
        return t;
    }

    /** Back-compat overload (defaults type = ANALYTE, no LOINC). */
    public void updateDetails(String name, Department department, String category, SpecimenType specimenType,
                              String specimenRequirements, String method, BigDecimal price, Integer turnaroundHours) {
        updateDetails(name, TestType.ANALYTE, department, category, specimenType, specimenRequirements,
                method, price, turnaroundHours, null);
    }

    public void updateDetails(String name, TestType type, Department department, String category,
                              SpecimenType specimenType, String specimenRequirements, String method,
                              BigDecimal price, Integer turnaroundHours, String loincCode) {
        this.name = name;
        this.type = type == null ? TestType.ANALYTE : type;
        this.department = department;
        this.category = category;
        this.specimenType = specimenType == null ? SpecimenType.OTHER : specimenType;
        this.specimenRequirements = specimenRequirements;
        this.method = method;
        this.price = price == null ? BigDecimal.ZERO : price;
        this.turnaroundHours = turnaroundHours;
        this.loincCode = loincCode;
    }

    public void setAutoVerifyEnabled(boolean autoVerifyEnabled) {
        this.autoVerifyEnabled = autoVerifyEnabled;
    }

    public void setResultMode(ResultMode resultMode) {
        this.resultMode = resultMode == null ? ResultMode.PARAMETRIC : resultMode;
    }

    public ResultMode getResultMode() {
        return resultMode;
    }

    public boolean isCulture() {
        return resultMode == ResultMode.CULTURE;
    }

    public boolean isAutoVerifyEnabled() {
        return autoVerifyEnabled;
    }

    public void updateSpecimenHandling(String containerType, BigDecimal minVolumeMl, String stabilityNote,
                                       boolean fastingRequired, Integer fastingHours,
                                       boolean referral, String referralLab) {
        this.containerType = containerType;
        this.minVolumeMl = minVolumeMl;
        this.stabilityNote = stabilityNote;
        this.fastingRequired = fastingRequired;
        this.fastingHours = fastingRequired ? fastingHours : null;
        this.referral = referral;
        this.referralLab = referral ? referralLab : null;
    }

    public TestParameter addParameter(String code, String name, String unit, ParameterDataType dataType, int displayOrder) {
        TestParameter parameter = new TestParameter(this, code, name, unit, dataType, displayOrder);
        parameters.add(parameter);
        return parameter;
    }

    public void clearParameters() {
        parameters.clear();
    }

    public void addProfileMember(LabTest member, int displayOrder) {
        profileMembers.add(new TestProfileMember(this, member, displayOrder));
    }

    public void clearProfileMembers() {
        profileMembers.clear();
    }

    /** The tests actually performed when this test is ordered — itself, or a profile's members. */
    public List<LabTest> effectiveTests() {
        if (type == TestType.PROFILE && !profileMembers.isEmpty()) {
            return profileMembers.stream().map(TestProfileMember::getMember).toList();
        }
        return List.of(this);
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public String getCode() {
        return code;
    }

    public String getName() {
        return name;
    }

    public TestType getType() {
        return type;
    }

    public Department getDepartment() {
        return department;
    }

    public String getCategory() {
        return category;
    }

    public SpecimenType getSpecimenType() {
        return specimenType;
    }

    public String getSpecimenRequirements() {
        return specimenRequirements;
    }

    public String getContainerType() {
        return containerType;
    }

    public BigDecimal getMinVolumeMl() {
        return minVolumeMl;
    }

    public String getStabilityNote() {
        return stabilityNote;
    }

    public boolean isFastingRequired() {
        return fastingRequired;
    }

    public Integer getFastingHours() {
        return fastingHours;
    }

    public boolean isReferral() {
        return referral;
    }

    public String getReferralLab() {
        return referralLab;
    }

    public String getMethod() {
        return method;
    }

    public String getLoincCode() {
        return loincCode;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public Integer getTurnaroundHours() {
        return turnaroundHours;
    }

    public boolean isActive() {
        return active;
    }

    public List<TestParameter> getParameters() {
        return parameters;
    }

    public List<TestProfileMember> getProfileMembers() {
        return profileMembers;
    }
}
