package np.com.lims.qc;

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
import np.com.lims.catalog.entity.LabTest;
import np.com.lims.common.audit.BaseEntity;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "qc_material")
public class QcMaterial extends BaseEntity {

    @Column(nullable = false, length = 120)
    private String name;

    @Column(length = 120)
    private String manufacturer;

    @Column(name = "lot_number", length = 60)
    private String lotNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private QcLevel level = QcLevel.LEVEL_1;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "lab_test_id", nullable = false)
    private LabTest test;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Column(length = 300)
    private String note;

    @Column(nullable = false)
    private boolean active = true;

    @OneToMany(mappedBy = "material", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    private List<QcTarget> targets = new ArrayList<>();

    protected QcMaterial() {
    }

    public static QcMaterial create(LabTest test) {
        QcMaterial m = new QcMaterial();
        m.test = test;
        return m;
    }

    public void update(String name, String manufacturer, String lotNumber, QcLevel level,
                       LocalDate expiryDate, String note, boolean active) {
        this.name = name;
        this.manufacturer = manufacturer;
        this.lotNumber = lotNumber;
        this.level = level == null ? QcLevel.LEVEL_1 : level;
        this.expiryDate = expiryDate;
        this.note = note;
        this.active = active;
    }

    public void clearTargets() {
        targets.clear();
    }

    public QcTarget addTarget(np.com.lims.catalog.entity.TestParameter parameter, java.math.BigDecimal mean,
                              java.math.BigDecimal sd, String unit, QcTargetSource source) {
        QcTarget t = new QcTarget(this, parameter, mean, sd, unit, source);
        targets.add(t);
        return t;
    }

    public String getName() { return name; }
    public String getManufacturer() { return manufacturer; }
    public String getLotNumber() { return lotNumber; }
    public QcLevel getLevel() { return level; }
    public LabTest getTest() { return test; }
    public LocalDate getExpiryDate() { return expiryDate; }
    public String getNote() { return note; }
    public boolean isActive() { return active; }
    public List<QcTarget> getTargets() { return targets; }
}
