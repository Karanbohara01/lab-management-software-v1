package np.com.lims.platform.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import np.com.lims.catalog.entity.SpecimenType;
import np.com.lims.common.audit.BaseEntity;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * One entry in the platform-wide master lab test catalogue — curated centrally by a platform
 * admin (see {@code np.com.lims.platform.MasterCatalogService}), browsable and importable by every
 * clinic. Deliberately NOT tenant-owned (no {@code organization_id}, no {@code @Filter}) — same
 * pattern as {@link Organization}/{@link SubscriptionPlan}. Importing copies these values onto a
 * brand-new, independently-owned {@code LabTest}/{@code TestParameter}/{@code ReferenceRange} tree
 * for the importing clinic — never a live link back here, matching the "copy-once" philosophy
 * {@code ParameterMaster} already established for a single parameter; this is the same idea for a
 * whole test.
 *
 * <p>{@code departmentName} is a plain label (e.g. "Hematology"), not a foreign key — a clinic's
 * own {@code Department} is tenant-owned and clinics don't share one, so import find-or-creates a
 * department by this name in the target org rather than referencing one directly.
 */
@Entity
@Table(name = "master_lab_test")
public class MasterLabTest extends BaseEntity {

    @Column(nullable = false, unique = true, length = 32)
    private String code;

    @Column(nullable = false, length = 160)
    private String name;

    @Column(name = "department_name", nullable = false, length = 120)
    private String departmentName;

    @Column(length = 80)
    private String category;

    @jakarta.persistence.Enumerated(jakarta.persistence.EnumType.STRING)
    @Column(name = "specimen_type", nullable = false, length = 32)
    private SpecimenType specimenType = SpecimenType.BLOOD_SERUM;

    @Column(name = "suggested_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal suggestedPrice = BigDecimal.ZERO;

    @Column(name = "turnaround_hours")
    private Integer turnaroundHours;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    @Column(nullable = false)
    private boolean active = true;

    @OneToMany(mappedBy = "masterTest", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("displayOrder ASC, id ASC")
    private List<MasterTestParameter> parameters = new ArrayList<>();

    protected MasterLabTest() {
    }

    public static MasterLabTest create(String code, String name, String departmentName) {
        MasterLabTest t = new MasterLabTest();
        t.code = code;
        t.name = name;
        t.departmentName = departmentName;
        return t;
    }

    public void update(String name, String departmentName, String category, SpecimenType specimenType,
                       BigDecimal suggestedPrice, Integer turnaroundHours, int displayOrder) {
        this.name = name;
        this.departmentName = departmentName;
        this.category = category;
        this.specimenType = specimenType == null ? SpecimenType.OTHER : specimenType;
        this.suggestedPrice = suggestedPrice == null ? BigDecimal.ZERO : suggestedPrice;
        this.turnaroundHours = turnaroundHours;
        this.displayOrder = displayOrder;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public MasterTestParameter addParameter(String code, String name, String unit,
                                            np.com.lims.catalog.entity.ParameterDataType dataType, int displayOrder) {
        MasterTestParameter p = new MasterTestParameter(this, code, name, unit, dataType, displayOrder);
        parameters.add(p);
        return p;
    }

    public void clearParameters() {
        parameters.clear();
    }

    public String getCode() {
        return code;
    }

    public String getName() {
        return name;
    }

    public String getDepartmentName() {
        return departmentName;
    }

    public String getCategory() {
        return category;
    }

    public SpecimenType getSpecimenType() {
        return specimenType;
    }

    public BigDecimal getSuggestedPrice() {
        return suggestedPrice;
    }

    public Integer getTurnaroundHours() {
        return turnaroundHours;
    }

    public int getDisplayOrder() {
        return displayOrder;
    }

    public boolean isActive() {
        return active;
    }

    public List<MasterTestParameter> getParameters() {
        return parameters;
    }
}
