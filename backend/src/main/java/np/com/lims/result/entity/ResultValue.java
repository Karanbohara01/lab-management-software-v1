package np.com.lims.result.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import np.com.lims.catalog.entity.ParameterDataType;
import np.com.lims.catalog.entity.TestParameter;
import np.com.lims.common.audit.BaseEntity;

import java.math.BigDecimal;

@Entity
@Table(name = "result_value")
public class ResultValue extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "test_result_id", nullable = false)
    private TestResult result;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "test_parameter_id", nullable = false)
    private TestParameter parameter;

    @Column(name = "parameter_name", nullable = false, length = 160)
    private String parameterName;

    @Column(name = "parameter_unit", length = 32)
    private String parameterUnit;

    @Enumerated(EnumType.STRING)
    @Column(name = "data_type", nullable = false, length = 32)
    private ParameterDataType dataType;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    @Column(name = "value_numeric", precision = 16, scale = 4)
    private BigDecimal valueNumeric;

    @Column(name = "value_text", length = 500)
    private String valueText;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private ResultFlag flag = ResultFlag.NONE;

    @Column(name = "reference_text", length = 160)
    private String referenceText;

    @Column(name = "previous_value", precision = 16, scale = 4)
    private BigDecimal previousValue;

    @Column(name = "delta_percent", precision = 8, scale = 2)
    private BigDecimal deltaPercent;

    @Column(name = "delta_breach", nullable = false)
    private boolean deltaBreach;

    @Column(length = 300)
    private String comment;

    protected ResultValue() {
    }

    ResultValue(TestResult result, TestParameter parameter) {
        this.result = result;
        this.parameter = parameter;
        this.parameterName = parameter.getName();
        this.parameterUnit = parameter.getUnit();
        this.dataType = parameter.getDataType();
        this.displayOrder = parameter.getDisplayOrder();
    }

    public void setValue(BigDecimal numeric, String text, ResultFlag flag, String referenceText) {
        this.valueNumeric = numeric;
        this.valueText = text;
        this.flag = flag == null ? ResultFlag.NONE : flag;
        this.referenceText = referenceText;
    }

    public void setDelta(BigDecimal previousValue, BigDecimal deltaPercent, boolean breach) {
        this.previousValue = previousValue;
        this.deltaPercent = deltaPercent;
        this.deltaBreach = breach;
    }

    public void clearDelta() {
        this.previousValue = null;
        this.deltaPercent = null;
        this.deltaBreach = false;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public boolean hasValue() {
        return valueNumeric != null || (valueText != null && !valueText.isBlank());
    }

    /** Human-readable current value for history diffing. */
    public String displayValue() {
        if (valueNumeric != null) {
            return valueNumeric.stripTrailingZeros().toPlainString();
        }
        return valueText;
    }

    public TestParameter getParameter() {
        return parameter;
    }

    public String getParameterName() {
        return parameterName;
    }

    public String getParameterUnit() {
        return parameterUnit;
    }

    public ParameterDataType getDataType() {
        return dataType;
    }

    public int getDisplayOrder() {
        return displayOrder;
    }

    public BigDecimal getValueNumeric() {
        return valueNumeric;
    }

    public String getValueText() {
        return valueText;
    }

    public ResultFlag getFlag() {
        return flag;
    }

    public String getReferenceText() {
        return referenceText;
    }

    public BigDecimal getPreviousValue() {
        return previousValue;
    }

    public BigDecimal getDeltaPercent() {
        return deltaPercent;
    }

    public boolean isDeltaBreach() {
        return deltaBreach;
    }

    public String getComment() {
        return comment;
    }
}
