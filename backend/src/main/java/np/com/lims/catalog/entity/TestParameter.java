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

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "test_parameter")
public class TestParameter extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "lab_test_id", nullable = false)
    private LabTest test;

    @Column(length = 32)
    private String code;

    @Column(nullable = false, length = 160)
    private String name;

    @Column(length = 32)
    private String unit;

    @Enumerated(EnumType.STRING)
    @Column(name = "data_type", nullable = false, length = 32)
    private ParameterDataType dataType = ParameterDataType.NUMERIC;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    /** Rounding for numeric values; null = keep as entered. */
    @Column(name = "decimal_places")
    private Integer decimalPlaces;

    /** Arithmetic expression over sibling parameter codes (and {@code age}, {@code sexM}, {@code sexF}). */
    @Column(name = "calculation_formula", length = 500)
    private String calculationFormula;

    /** Pipe-separated picklist for CATEGORICAL parameters. */
    @Column(name = "allowed_values", length = 500)
    private String allowedValues;

    /** Plausibility limits — a manually entered value outside this range is rejected. */
    @Column(name = "absurd_low", precision = 16, scale = 4)
    private BigDecimal absurdLow;

    @Column(name = "absurd_high", precision = 16, scale = 4)
    private BigDecimal absurdHigh;

    @Column(length = 120)
    private String method;

    @Column(name = "loinc_code", length = 20)
    private String loincCode;

    /** Optional sub-section heading shown above this parameter on entry and the report. */
    @Column(name = "group_heading", length = 120)
    private String groupHeading;

    /** Flag when a numeric value differs from the patient's previous result by more than this %. */
    @Column(name = "delta_check_percent", precision = 6, scale = 2)
    private BigDecimal deltaCheckPercent;

    @OneToMany(mappedBy = "parameter", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    @org.hibernate.annotations.BatchSize(size = 50)
    private List<ReferenceRange> referenceRanges = new ArrayList<>();

    protected TestParameter() {
    }

    TestParameter(LabTest test, String code, String name, String unit, ParameterDataType dataType, int displayOrder) {
        this.test = test;
        this.code = code;
        this.name = name;
        this.unit = unit;
        this.dataType = dataType == null ? ParameterDataType.NUMERIC : dataType;
        this.displayOrder = displayOrder;
    }

    public void configure(Integer decimalPlaces, String calculationFormula, String allowedValues,
                          BigDecimal absurdLow, BigDecimal absurdHigh, String method, String loincCode,
                          String groupHeading, BigDecimal deltaCheckPercent) {
        this.decimalPlaces = decimalPlaces;
        this.calculationFormula = calculationFormula;
        this.allowedValues = allowedValues;
        this.absurdLow = absurdLow;
        this.absurdHigh = absurdHigh;
        this.method = method;
        this.loincCode = loincCode;
        this.groupHeading = groupHeading;
        this.deltaCheckPercent = deltaCheckPercent;
    }

    public BigDecimal getDeltaCheckPercent() {
        return deltaCheckPercent;
    }

    /** Back-compat overload — age band in years, no effective date/source, not pregnancy-specific. */
    public ReferenceRange addRange(RangeGender gender, Integer ageLow, Integer ageHigh,
                                   BigDecimal low, BigDecimal high, String normalText,
                                   BigDecimal criticalLow, BigDecimal criticalHigh) {
        return addRange(gender, ageLow, ageHigh, AgeUnit.YEARS, low, high, normalText,
                criticalLow, criticalHigh, null, null, false);
    }

    public ReferenceRange addRange(RangeGender gender, Integer ageLow, Integer ageHigh, AgeUnit ageUnit,
                                   BigDecimal low, BigDecimal high, String normalText,
                                   BigDecimal criticalLow, BigDecimal criticalHigh,
                                   java.time.LocalDate effectiveFrom, String source, boolean appliesToPregnant) {
        ReferenceRange range = new ReferenceRange(this, gender, ageLow, ageHigh, ageUnit, low, high, normalText,
                criticalLow, criticalHigh, effectiveFrom, source, appliesToPregnant);
        referenceRanges.add(range);
        return range;
    }

    public void clearRanges() {
        referenceRanges.clear();
    }

    public boolean isCalculated() {
        return calculationFormula != null && !calculationFormula.isBlank();
    }

    public List<String> allowedValueList() {
        if (allowedValues == null || allowedValues.isBlank()) {
            return List.of();
        }
        return java.util.Arrays.stream(allowedValues.split("\\|"))
                .map(String::trim).filter(s -> !s.isEmpty()).toList();
    }

    public String getCode() {
        return code;
    }

    public String getName() {
        return name;
    }

    public String getUnit() {
        return unit;
    }

    public ParameterDataType getDataType() {
        return dataType;
    }

    public int getDisplayOrder() {
        return displayOrder;
    }

    public Integer getDecimalPlaces() {
        return decimalPlaces;
    }

    public String getCalculationFormula() {
        return calculationFormula;
    }

    public String getAllowedValues() {
        return allowedValues;
    }

    public BigDecimal getAbsurdLow() {
        return absurdLow;
    }

    public BigDecimal getAbsurdHigh() {
        return absurdHigh;
    }

    public String getMethod() {
        return method;
    }

    public String getLoincCode() {
        return loincCode;
    }

    public String getGroupHeading() {
        return groupHeading;
    }

    public List<ReferenceRange> getReferenceRanges() {
        return referenceRanges;
    }
}
