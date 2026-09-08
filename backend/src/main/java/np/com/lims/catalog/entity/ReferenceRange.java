package np.com.lims.catalog.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import np.com.lims.common.audit.BaseEntity;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * A normal (and optionally critical) range for a {@link TestParameter}, scoped by gender, an age
 * band (in {@link #ageUnit}), pregnancy and an effective date. Result verification picks the most
 * specific range that is in effect for the patient.
 */
@Entity
@Table(name = "reference_range")
public class ReferenceRange extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "test_parameter_id", nullable = false)
    private TestParameter parameter;

    @Enumerated(EnumType.STRING)
    @Column(name = "applies_to_gender", nullable = false, length = 16)
    private RangeGender appliesToGender = RangeGender.ALL;

    @Column(name = "age_min_years")
    private Integer ageLow;

    @Column(name = "age_max_years")
    private Integer ageHigh;

    @Enumerated(EnumType.STRING)
    @Column(name = "age_unit", nullable = false, length = 8)
    private AgeUnit ageUnit = AgeUnit.YEARS;

    @Column(name = "applies_to_pregnant", nullable = false)
    private boolean appliesToPregnant;

    @Column(name = "effective_from")
    private LocalDate effectiveFrom;

    @Column(length = 200)
    private String source;

    @Column(name = "low_value", precision = 14, scale = 4)
    private BigDecimal lowValue;

    @Column(name = "high_value", precision = 14, scale = 4)
    private BigDecimal highValue;

    @Column(name = "normal_text", length = 120)
    private String normalText;

    @Column(name = "critical_low", precision = 14, scale = 4)
    private BigDecimal criticalLow;

    @Column(name = "critical_high", precision = 14, scale = 4)
    private BigDecimal criticalHigh;

    protected ReferenceRange() {
    }

    ReferenceRange(TestParameter parameter, RangeGender appliesToGender, Integer ageLow, Integer ageHigh,
                   AgeUnit ageUnit, BigDecimal lowValue, BigDecimal highValue, String normalText,
                   BigDecimal criticalLow, BigDecimal criticalHigh, LocalDate effectiveFrom, String source,
                   boolean appliesToPregnant) {
        this.parameter = parameter;
        this.appliesToGender = appliesToGender == null ? RangeGender.ALL : appliesToGender;
        this.ageLow = ageLow;
        this.ageHigh = ageHigh;
        this.ageUnit = ageUnit == null ? AgeUnit.YEARS : ageUnit;
        this.lowValue = lowValue;
        this.highValue = highValue;
        this.normalText = normalText;
        this.criticalLow = criticalLow;
        this.criticalHigh = criticalHigh;
        this.effectiveFrom = effectiveFrom;
        this.source = source;
        this.appliesToPregnant = appliesToPregnant;
    }

    public RangeGender getAppliesToGender() {
        return appliesToGender;
    }

    public Integer getAgeLow() {
        return ageLow;
    }

    public Integer getAgeHigh() {
        return ageHigh;
    }

    public AgeUnit getAgeUnit() {
        return ageUnit;
    }

    public boolean isAppliesToPregnant() {
        return appliesToPregnant;
    }

    public LocalDate getEffectiveFrom() {
        return effectiveFrom;
    }

    public String getSource() {
        return source;
    }

    public BigDecimal getLowValue() {
        return lowValue;
    }

    public BigDecimal getHighValue() {
        return highValue;
    }

    public String getNormalText() {
        return normalText;
    }

    public BigDecimal getCriticalLow() {
        return criticalLow;
    }

    public BigDecimal getCriticalHigh() {
        return criticalHigh;
    }
}
