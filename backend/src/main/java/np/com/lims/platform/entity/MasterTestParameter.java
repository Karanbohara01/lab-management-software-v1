package np.com.lims.platform.entity;

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
import np.com.lims.catalog.entity.ParameterDataType;
import np.com.lims.common.audit.BaseEntity;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "master_test_parameter")
public class MasterTestParameter extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "master_lab_test_id", nullable = false)
    private MasterLabTest masterTest;

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

    @Column(name = "decimal_places")
    private Integer decimalPlaces;

    @Column(name = "group_heading", length = 120)
    private String groupHeading;

    @OneToMany(mappedBy = "masterParameter", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    @org.hibernate.annotations.BatchSize(size = 50)
    private List<MasterReferenceRange> referenceRanges = new ArrayList<>();

    protected MasterTestParameter() {
    }

    MasterTestParameter(MasterLabTest masterTest, String code, String name, String unit,
                        ParameterDataType dataType, int displayOrder) {
        this.masterTest = masterTest;
        this.code = code;
        this.name = name;
        this.unit = unit;
        this.dataType = dataType == null ? ParameterDataType.NUMERIC : dataType;
        this.displayOrder = displayOrder;
    }

    public void configure(Integer decimalPlaces, String groupHeading) {
        this.decimalPlaces = decimalPlaces;
        this.groupHeading = groupHeading;
    }

    public MasterReferenceRange addRange(np.com.lims.catalog.entity.RangeGender gender,
                                         java.math.BigDecimal low, java.math.BigDecimal high,
                                         java.math.BigDecimal criticalLow, java.math.BigDecimal criticalHigh,
                                         String normalText) {
        MasterReferenceRange range = new MasterReferenceRange(this, gender, low, high, criticalLow, criticalHigh, normalText);
        referenceRanges.add(range);
        return range;
    }

    public void clearRanges() {
        referenceRanges.clear();
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

    public String getGroupHeading() {
        return groupHeading;
    }

    public List<MasterReferenceRange> getReferenceRanges() {
        return referenceRanges;
    }
}
