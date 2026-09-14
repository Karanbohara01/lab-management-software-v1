package np.com.lims.platform.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import np.com.lims.catalog.entity.RangeGender;
import np.com.lims.common.audit.BaseEntity;

import java.math.BigDecimal;

@Entity
@Table(name = "master_reference_range")
public class MasterReferenceRange extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "master_test_parameter_id", nullable = false)
    private MasterTestParameter masterParameter;

    @Enumerated(EnumType.STRING)
    @Column(name = "applies_to_gender", nullable = false, length = 16)
    private RangeGender appliesToGender = RangeGender.ALL;

    @Column(name = "low_value", precision = 16, scale = 4)
    private BigDecimal lowValue;

    @Column(name = "high_value", precision = 16, scale = 4)
    private BigDecimal highValue;

    @Column(name = "critical_low", precision = 16, scale = 4)
    private BigDecimal criticalLow;

    @Column(name = "critical_high", precision = 16, scale = 4)
    private BigDecimal criticalHigh;

    @Column(name = "normal_text", length = 200)
    private String normalText;

    protected MasterReferenceRange() {
    }

    MasterReferenceRange(MasterTestParameter masterParameter, RangeGender gender, BigDecimal low, BigDecimal high,
                         BigDecimal criticalLow, BigDecimal criticalHigh, String normalText) {
        this.masterParameter = masterParameter;
        this.appliesToGender = gender == null ? RangeGender.ALL : gender;
        this.lowValue = low;
        this.highValue = high;
        this.criticalLow = criticalLow;
        this.criticalHigh = criticalHigh;
        this.normalText = normalText;
    }

    public RangeGender getAppliesToGender() {
        return appliesToGender;
    }

    public BigDecimal getLowValue() {
        return lowValue;
    }

    public BigDecimal getHighValue() {
        return highValue;
    }

    public BigDecimal getCriticalLow() {
        return criticalLow;
    }

    public BigDecimal getCriticalHigh() {
        return criticalHigh;
    }

    public String getNormalText() {
        return normalText;
    }
}
