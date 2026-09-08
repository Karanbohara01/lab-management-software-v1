package np.com.lims.report.entity;

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
import np.com.lims.common.exception.ApiException;
import np.com.lims.order.entity.LabOrder;
import np.com.lims.patient.entity.Patient;
import np.com.lims.result.entity.ResultFlag;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "report")
public class Report extends BaseEntity {

    @Column(name = "report_number", nullable = false, length = 24, updatable = false)
    private String reportNumber;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "lab_order_id", nullable = false, updatable = false)
    private LabOrder order;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "patient_id", nullable = false, updatable = false)
    private Patient patient;

    @Column(name = "referring_doctor_name", length = 160)
    private String referringDoctorName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private ReportStatus status = ReportStatus.GENERATED;

    @Column(name = "report_version", nullable = false)
    private int reportVersion = 1;

    @jakarta.persistence.Enumerated(jakarta.persistence.EnumType.STRING)
    @Column(name = "report_type", nullable = false, length = 16)
    private ReportType reportType = ReportType.FINAL;

    @Column(name = "verification_token", length = 40)
    private String verificationToken;

    @Column(name = "content_hash", length = 64)
    private String contentHash;

    @Column(name = "signed_by", length = 120)
    private String signedBy;

    @Column(name = "signer_credentials", length = 120)
    private String signerCredentials;

    @Column(name = "signed_at")
    private Instant signedAt;

    @Column(name = "generated_at", nullable = false)
    private Instant generatedAt;
    @Column(name = "generated_by", nullable = false, length = 100)
    private String generatedBy;
    @Column(name = "released_at")
    private Instant releasedAt;
    @Column(name = "released_by", length = 100)
    private String releasedBy;
    @Column(name = "delivered_at")
    private Instant deliveredAt;
    @Column(name = "delivered_by", length = 100)
    private String deliveredBy;
    @Column(name = "delivery_method", length = 32)
    private String deliveryMethod;
    @Column(name = "delivery_recipient", length = 200)
    private String deliveryRecipient;

    @OneToMany(mappedBy = "report", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("displayOrder ASC, id ASC")
    private List<ReportTest> tests = new ArrayList<>();

    protected Report() {
    }

    public static Report open(String reportNumber, LabOrder order, String actor) {
        Report report = new Report();
        report.reportNumber = reportNumber;
        report.order = order;
        report.patient = order.getPatient();
        report.referringDoctorName = order.getReferringDoctor() == null ? null
                : order.getReferringDoctor().getFullName();
        report.status = ReportStatus.GENERATED;
        report.generatedAt = Instant.now();
        report.generatedBy = actor;
        return report;
    }

    /** Wipes the snapshot for a fresh regeneration and bumps the version. */
    public void beginRegeneration(String actor) {
        tests.clear();
        this.reportVersion += 1;
        this.generatedAt = Instant.now();
        this.generatedBy = actor;
        this.referringDoctorName = order.getReferringDoctor() == null ? null
                : order.getReferringDoctor().getFullName();
    }

    public ReportTest addTest(String testCode, String testName, String departmentName, String method,
                              String specimen, String accessionNumber, String comment, String verifiedBy,
                              String approvedBy, Instant approvedAt) {
        ReportTest reportTest = new ReportTest(this, testCode, testName, departmentName, method, specimen,
                accessionNumber, comment, verifiedBy, approvedBy, approvedAt, tests.size() + 1);
        tests.add(reportTest);
        return reportTest;
    }

    public void release(String actor) {
        if (status != ReportStatus.GENERATED) {
            throw ApiException.invalidTransition("Only a generated report can be released");
        }
        this.status = ReportStatus.RELEASED;
        this.releasedAt = Instant.now();
        this.releasedBy = actor;
    }

    public void markType(ReportType type) {
        this.reportType = type == null ? ReportType.FINAL : type;
    }

    public void sign(String signedBy, String credentials, String contentHash, String verificationToken) {
        this.signedBy = signedBy;
        this.signerCredentials = credentials;
        this.contentHash = contentHash;
        if (this.verificationToken == null) {
            this.verificationToken = verificationToken;
        }
        this.signedAt = Instant.now();
    }

    public void markDelivered(String actor, String method, String recipient) {
        if (status == ReportStatus.GENERATED) {
            throw ApiException.invalidTransition("Release the report before recording delivery");
        }
        this.status = ReportStatus.DELIVERED;
        this.deliveredAt = Instant.now();
        this.deliveredBy = actor;
        this.deliveryMethod = method;
        this.deliveryRecipient = recipient;
    }

    public boolean hasCritical() {
        return tests.stream().flatMap(t -> t.getParameters().stream())
                .anyMatch(p -> p.getFlag() == ResultFlag.CRITICAL_LOW || p.getFlag() == ResultFlag.CRITICAL_HIGH);
    }

    public String getReportNumber() {
        return reportNumber;
    }

    public LabOrder getOrder() {
        return order;
    }

    public Patient getPatient() {
        return patient;
    }

    public String getReferringDoctorName() {
        return referringDoctorName;
    }

    public ReportStatus getStatus() {
        return status;
    }

    public int getReportVersion() {
        return reportVersion;
    }

    public ReportType getReportType() {
        return reportType;
    }

    public String getVerificationToken() {
        return verificationToken;
    }

    public String getContentHash() {
        return contentHash;
    }

    public String getSignedBy() {
        return signedBy;
    }

    public String getSignerCredentials() {
        return signerCredentials;
    }

    public Instant getSignedAt() {
        return signedAt;
    }

    public Instant getGeneratedAt() {
        return generatedAt;
    }

    public String getGeneratedBy() {
        return generatedBy;
    }

    public Instant getReleasedAt() {
        return releasedAt;
    }

    public String getReleasedBy() {
        return releasedBy;
    }

    public Instant getDeliveredAt() {
        return deliveredAt;
    }

    public String getDeliveredBy() {
        return deliveredBy;
    }

    public String getDeliveryMethod() {
        return deliveryMethod;
    }

    public String getDeliveryRecipient() {
        return deliveryRecipient;
    }

    public List<ReportTest> getTests() {
        return tests;
    }
}
