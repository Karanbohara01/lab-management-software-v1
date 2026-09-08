package np.com.lims.report.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import np.com.lims.result.entity.ResultFlag;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "report_test")
public class ReportTest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "report_id", nullable = false)
    private Report report;

    @Column(name = "test_code", nullable = false, length = 32)
    private String testCode;

    @Column(name = "test_name", nullable = false, length = 160)
    private String testName;

    @Column(name = "department_name", nullable = false, length = 120)
    private String departmentName;

    @Column(length = 120)
    private String method;

    @Column(length = 48)
    private String specimen;

    @Column(name = "accession_number", length = 24)
    private String accessionNumber;

    @Column(length = 2000)
    private String comment;

    @Column(name = "verified_by", length = 100)
    private String verifiedBy;

    @Column(name = "approved_by", length = 100)
    private String approvedBy;

    @Column(name = "approved_at")
    private Instant approvedAt;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    @OneToMany(mappedBy = "reportTest", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("displayOrder ASC, id ASC")
    @org.hibernate.annotations.BatchSize(size = 50)
    private List<ReportParameter> parameters = new ArrayList<>();

    protected ReportTest() {
    }

    ReportTest(Report report, String testCode, String testName, String departmentName, String method,
               String specimen, String accessionNumber, String comment, String verifiedBy, String approvedBy,
               Instant approvedAt, int displayOrder) {
        this.report = report;
        this.testCode = testCode;
        this.testName = testName;
        this.departmentName = departmentName;
        this.method = method;
        this.specimen = specimen;
        this.accessionNumber = accessionNumber;
        this.comment = comment;
        this.verifiedBy = verifiedBy;
        this.approvedBy = approvedBy;
        this.approvedAt = approvedAt;
        this.displayOrder = displayOrder;
    }

    public void addParameter(String name, String unit, String valueDisplay, ResultFlag flag,
                             String referenceText, int order, String comment) {
        parameters.add(new ReportParameter(this, name, unit, valueDisplay, flag, referenceText, order, comment));
    }

    public String getTestCode() {
        return testCode;
    }

    public String getTestName() {
        return testName;
    }

    public String getDepartmentName() {
        return departmentName;
    }

    public String getMethod() {
        return method;
    }

    public String getSpecimen() {
        return specimen;
    }

    public String getAccessionNumber() {
        return accessionNumber;
    }

    public String getComment() {
        return comment;
    }

    public String getVerifiedBy() {
        return verifiedBy;
    }

    public String getApprovedBy() {
        return approvedBy;
    }

    public Instant getApprovedAt() {
        return approvedAt;
    }

    public int getDisplayOrder() {
        return displayOrder;
    }

    public List<ReportParameter> getParameters() {
        return parameters;
    }
}
