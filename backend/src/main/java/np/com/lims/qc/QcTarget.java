package np.com.lims.qc;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import np.com.lims.catalog.entity.TestParameter;
import np.com.lims.common.audit.BaseEntity;

import java.math.BigDecimal;

@Entity
@Table(name = "qc_target")
public class QcTarget extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "qc_material_id", nullable = false)
    private QcMaterial material;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "test_parameter_id", nullable = false)
    private TestParameter parameter;

    @Column(name = "target_mean", nullable = false, precision = 16, scale = 4)
    private BigDecimal targetMean;

    @Column(name = "target_sd", nullable = false, precision = 16, scale = 4)
    private BigDecimal targetSd;

    @Column(length = 20)
    private String unit;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private QcTargetSource source = QcTargetSource.ASSIGNED;

    protected QcTarget() {
    }

    QcTarget(QcMaterial material, TestParameter parameter, BigDecimal targetMean, BigDecimal targetSd,
             String unit, QcTargetSource source) {
        this.material = material;
        this.parameter = parameter;
        this.targetMean = targetMean;
        this.targetSd = targetSd;
        this.unit = unit;
        this.source = source == null ? QcTargetSource.ASSIGNED : source;
    }

    public QcMaterial getMaterial() { return material; }
    public TestParameter getParameter() { return parameter; }
    public BigDecimal getTargetMean() { return targetMean; }
    public BigDecimal getTargetSd() { return targetSd; }
    public String getUnit() { return unit; }
    public QcTargetSource getSource() { return source; }
}
