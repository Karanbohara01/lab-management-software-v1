package np.com.lims.result.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import np.com.lims.catalog.entity.TestParameter;
import np.com.lims.common.audit.BaseEntity;
import np.com.lims.common.exception.ApiException;
import np.com.lims.order.entity.LabOrder;
import np.com.lims.patient.entity.Patient;
import np.com.lims.sample.entity.Sample;
import np.com.lims.sample.entity.SampleItem;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "test_result")
public class TestResult extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sample_item_id", nullable = false, updatable = false)
    private SampleItem sampleItem;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sample_id", nullable = false)
    private Sample sample;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "lab_order_id", nullable = false)
    private LabOrder order;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @Column(name = "lab_test_id", nullable = false)
    private Long testId;

    @Column(name = "test_code", nullable = false, length = 32)
    private String testCode;

    @Column(name = "test_name", nullable = false, length = 160)
    private String testName;

    @Column(name = "department_id", nullable = false)
    private Long departmentId;

    @Column(name = "department_name", nullable = false, length = 120)
    private String departmentName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private ResultStatus status = ResultStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 12)
    private np.com.lims.common.model.Priority priority = np.com.lims.common.model.Priority.ROUTINE;

    @Column(name = "due_at")
    private Instant dueAt;

    @Column(name = "auto_verified", nullable = false)
    private boolean autoVerified;

    @Column(name = "critical_ack_required", nullable = false)
    private boolean criticalAckRequired;

    @Column(length = 2000)
    private String comment;

    @Column(name = "has_abnormal", nullable = false)
    private boolean hasAbnormal;

    @Column(name = "has_critical", nullable = false)
    private boolean hasCritical;

    @Column(name = "entered_at")
    private Instant enteredAt;
    @Column(name = "entered_by", length = 100)
    private String enteredBy;
    @Column(name = "verified_at")
    private Instant verifiedAt;
    @Column(name = "verified_by", length = 100)
    private String verifiedBy;
    @Column(name = "approved_at")
    private Instant approvedAt;
    @Column(name = "approved_by", length = 100)
    private String approvedBy;
    @Column(name = "amended_at")
    private Instant amendedAt;
    @Column(name = "amended_by", length = 100)
    private String amendedBy;
    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    @OneToMany(mappedBy = "result", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("displayOrder ASC, id ASC")
    private List<ResultValue> values = new ArrayList<>();

    @OneToMany(mappedBy = "result", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("changedAt ASC, id ASC")
    private List<ResultValueHistory> history = new ArrayList<>();

    protected TestResult() {
    }

    public static TestResult create(SampleItem sampleItem, Integer turnaroundHours) {
        TestResult r = new TestResult();
        r.sampleItem = sampleItem;
        r.sample = sampleItem.getSample();
        r.order = sampleItem.getSample().getOrder();
        r.patient = sampleItem.getSample().getPatient();
        r.testId = sampleItem.getTest().getId();
        r.testCode = sampleItem.getTestCode();
        r.testName = sampleItem.getTestName();
        r.departmentId = sampleItem.getDepartmentId();
        r.departmentName = sampleItem.getDepartmentName();
        r.status = ResultStatus.PENDING;
        r.priority = r.order.getPriority();
        if (turnaroundHours != null && turnaroundHours > 0) {
            long minutes = Math.max(60, Math.round(turnaroundHours * 60 * r.priority.turnaroundFactor()));
            r.dueAt = r.order.getOrderedAt().plus(java.time.Duration.ofMinutes(minutes));
        }
        return r;
    }

    public boolean isOverdue() {
        return dueAt != null && status != ResultStatus.APPROVED && Instant.now().isAfter(dueAt);
    }

    public boolean hasDeltaBreach() {
        return values.stream().anyMatch(ResultValue::isDeltaBreach);
    }

    public void markAutoVerified() {
        this.autoVerified = true;
    }

    public ResultValue addParameterSlot(TestParameter parameter) {
        ResultValue value = new ResultValue(this, parameter);
        values.add(value);
        return value;
    }

    public void recomputeAbnormalFlags() {
        this.hasAbnormal = values.stream().anyMatch(v -> v.getFlag().isAbnormal());
        this.hasCritical = values.stream().anyMatch(v -> v.getFlag().isCritical());
    }

    public void recordChange(String parameterName, String oldValue, String newValue, String reason, String actor) {
        history.add(new ResultValueHistory(this, parameterName, oldValue, newValue, reason, actor));
    }

    public void markEntered(String actor) {
        require(status.canTransitionTo(ResultStatus.ENTERED) || status == ResultStatus.ENTERED,
                "Values can only be edited while the result is pending or entered");
        this.status = ResultStatus.ENTERED;
        this.enteredAt = Instant.now();
        this.enteredBy = actor;
        this.rejectionReason = null;
    }

    public void verify(String actor) {
        transition(ResultStatus.VERIFIED);
        if (values.stream().noneMatch(ResultValue::hasValue)) {
            throw ApiException.conflict("Cannot verify a result with no values entered");
        }
        this.verifiedAt = Instant.now();
        this.verifiedBy = actor;
    }

    public void approve(String actor) {
        transition(ResultStatus.APPROVED);
        this.approvedAt = Instant.now();
        this.approvedBy = actor;
        if (hasCritical) {
            this.criticalAckRequired = true;
        }
    }

    public void clearCriticalAck() {
        this.criticalAckRequired = false;
    }

    public boolean isCriticalAckRequired() {
        return criticalAckRequired;
    }

    public void sendBackForCorrection(String actor, String reason) {
        if (status != ResultStatus.VERIFIED && status != ResultStatus.ENTERED) {
            throw ApiException.invalidTransition("Only entered or verified results can be sent back");
        }
        this.status = ResultStatus.ENTERED;
        this.verifiedAt = null;
        this.verifiedBy = null;
        this.rejectionReason = reason;
        recordChange("—", null, null, "Sent back for correction: " + reason, actor);
    }

    public void amend(String actor) {
        require(status == ResultStatus.APPROVED, "Only approved results can be amended");
        this.amendedAt = Instant.now();
        this.amendedBy = actor;
    }

    private void transition(ResultStatus target) {
        if (!status.canTransitionTo(target)) {
            throw ApiException.invalidTransition(
                    "Result for " + testCode + " cannot move from " + status + " to " + target);
        }
        this.status = target;
    }

    private static void require(boolean condition, String message) {
        if (!condition) {
            throw ApiException.invalidTransition(message);
        }
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public Sample getSample() {
        return sample;
    }

    public LabOrder getOrder() {
        return order;
    }

    public Patient getPatient() {
        return patient;
    }

    public Long getTestId() {
        return testId;
    }

    public String getTestCode() {
        return testCode;
    }

    public String getTestName() {
        return testName;
    }

    public Long getDepartmentId() {
        return departmentId;
    }

    public String getDepartmentName() {
        return departmentName;
    }

    public ResultStatus getStatus() {
        return status;
    }

    public np.com.lims.common.model.Priority getPriority() {
        return priority;
    }

    public Instant getDueAt() {
        return dueAt;
    }

    public boolean isAutoVerified() {
        return autoVerified;
    }

    public String getComment() {
        return comment;
    }

    public boolean isHasAbnormal() {
        return hasAbnormal;
    }

    public boolean isHasCritical() {
        return hasCritical;
    }

    public Instant getEnteredAt() {
        return enteredAt;
    }

    public String getEnteredBy() {
        return enteredBy;
    }

    public Instant getVerifiedAt() {
        return verifiedAt;
    }

    public String getVerifiedBy() {
        return verifiedBy;
    }

    public Instant getApprovedAt() {
        return approvedAt;
    }

    public String getApprovedBy() {
        return approvedBy;
    }

    public Instant getAmendedAt() {
        return amendedAt;
    }

    public String getAmendedBy() {
        return amendedBy;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public List<ResultValue> getValues() {
        return values;
    }

    public List<ResultValueHistory> getHistory() {
        return history;
    }
}
