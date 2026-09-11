package np.com.lims.microbiology.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import np.com.lims.common.audit.BaseEntity;

/** An antimicrobial agent that can appear on a culture susceptibility panel. */
@Entity
@Table(name = "antibiotic")
public class Antibiotic extends BaseEntity {

    @Column(nullable = false, length = 16, unique = true)
    private String code;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(name = "drug_class", length = 60)
    private String drugClass;

    @Column(nullable = false)
    private boolean active = true;

    protected Antibiotic() {
    }

    public static Antibiotic create(String code, String name, String drugClass) {
        Antibiotic a = new Antibiotic();
        a.code = code;
        a.name = name;
        a.drugClass = drugClass;
        a.active = true;
        return a;
    }

    public void update(String name, String drugClass, boolean active) {
        this.name = name;
        this.drugClass = drugClass;
        this.active = active;
    }

    public String getCode() {
        return code;
    }

    public String getName() {
        return name;
    }

    public String getDrugClass() {
        return drugClass;
    }

    public boolean isActive() {
        return active;
    }
}
