package np.com.lims.qc;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import np.com.lims.catalog.entity.LabTest;
import np.com.lims.catalog.entity.TestParameter;
import np.com.lims.common.audit.BaseEntity;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "qc_run")
public class QcRun extends BaseEntity {

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "qc_material_id", nullable = false)
    private QcMaterial material;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "test_parameter_id", nullable = false)
    private TestParameter parameter;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "lab_test_id", nullable = false)
    private LabTest test;

    @Column(nullable = false, precision = 16, scale = 4)
    private BigDecimal value;

    @Column(name = "target_mean", nullable = false, precision = 16, scale = 4)
    private BigDecimal targetMean;

    @Column(name = "target_sd", nullable = false, precision = 16, scale = 4)
    private BigDecimal targetSd;

    @Column(name = "z_score", precision = 8, scale = 3)
    private BigDecimal zScore;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 12)
    private QcStatus status = QcStatus.IN_CONTROL;

    @Column(name = "violated_rules", length = 200)
    private String violatedRules;

    @Column(length = 80)
    private String analyzer;

    @Column(length = 20)
    private String shift;

    @Column(length = 100)
    private String operator;

    @Column(nullable = false)
    private boolean accepted;

    @Column(length = 300)
    private String comment;

    @Column(name = "run_at", nullable = false)
    private Instant runAt = Instant.now();

    protected QcRun() {
    }

    public static QcRun record(QcMaterial material, TestParameter parameter, BigDecimal value,
                               BigDecimal mean, BigDecimal sd, BigDecimal zScore, QcStatus status,
                               String violatedRules, String analyzer, String shift, String operator, String comment) {
        QcRun r = new QcRun();
        r.material = material;
        r.parameter = parameter;
        r.test = material.getTest();
        r.value = value;
        r.targetMean = mean;
        r.targetSd = sd;
        r.zScore = zScore;
        r.status = status;
        r.violatedRules = violatedRules;
        r.analyzer = analyzer;
        r.shift = shift;
        r.operator = operator;
        r.comment = comment;
        r.runAt = Instant.now();
        return r;
    }

    public void accept(String comment) {
        this.accepted = true;
        if (comment != null) {
            this.comment = comment;
        }
    }

    public QcMaterial getMaterial() { return material; }
    public TestParameter getParameter() { return parameter; }
    public LabTest getTest() { return test; }
    public BigDecimal getValue() { return value; }
    public BigDecimal getTargetMean() { return targetMean; }
    public BigDecimal getTargetSd() { return targetSd; }
    public BigDecimal getZScore() { return zScore; }
    public QcStatus getStatus() { return status; }
    public String getViolatedRules() { return violatedRules; }
    public String getAnalyzer() { return analyzer; }
    public String getShift() { return shift; }
    public String getOperator() { return operator; }
    public boolean isAccepted() { return accepted; }
    public String getComment() { return comment; }
    public Instant getRunAt() { return runAt; }
}
