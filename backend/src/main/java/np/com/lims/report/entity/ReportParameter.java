package np.com.lims.report.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import np.com.lims.result.entity.ResultFlag;

@Entity
@Table(name = "report_parameter")
public class ReportParameter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "report_test_id", nullable = false)
    private ReportTest reportTest;

    @Column(nullable = false, length = 160)
    private String name;

    @Column(length = 32)
    private String unit;

    @Column(name = "value_display", length = 500)
    private String valueDisplay;

    @jakarta.persistence.Enumerated(jakarta.persistence.EnumType.STRING)
    @Column(nullable = false, length = 16)
    private ResultFlag flag = ResultFlag.NONE;

    @Column(name = "reference_text", length = 160)
    private String referenceText;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    @Column(length = 300)
    private String comment;

    protected ReportParameter() {
    }

    ReportParameter(ReportTest reportTest, String name, String unit, String valueDisplay,
                    ResultFlag flag, String referenceText, int displayOrder, String comment) {
        this.reportTest = reportTest;
        this.name = name;
        this.unit = unit;
        this.valueDisplay = valueDisplay;
        this.flag = flag == null ? ResultFlag.NONE : flag;
        this.referenceText = referenceText;
        this.displayOrder = displayOrder;
        this.comment = comment;
    }

    public String getComment() {
        return comment;
    }

    public String getName() {
        return name;
    }

    public String getUnit() {
        return unit;
    }

    public String getValueDisplay() {
        return valueDisplay;
    }

    public ResultFlag getFlag() {
        return flag;
    }

    public String getReferenceText() {
        return referenceText;
    }

    public int getDisplayOrder() {
        return displayOrder;
    }
}
