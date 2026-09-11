package np.com.lims.result.entity;

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

import java.util.ArrayList;
import java.util.List;

/** One organism isolated from a culture, with its antibiotic susceptibility panel. */
@Entity
@Table(name = "culture_isolate")
public class CultureIsolate extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "test_result_id", nullable = false)
    private TestResult result;

    @Column(name = "sequence_no", nullable = false)
    private int sequenceNo = 1;

    @Column(name = "organism_name", nullable = false, length = 160)
    private String organismName;

    @Column(name = "colony_count", length = 60)
    private String colonyCount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private OrganismSignificance significance = OrganismSignificance.PATHOGEN;

    @Column(length = 500)
    private String note;

    @OneToMany(mappedBy = "isolate", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sequenceNo ASC, id ASC")
    @org.hibernate.annotations.BatchSize(size = 40)
    private List<CultureSusceptibility> susceptibilities = new ArrayList<>();

    protected CultureIsolate() {
    }

    public CultureIsolate(TestResult result, int sequenceNo, String organismName, String colonyCount,
                          OrganismSignificance significance, String note) {
        this.result = result;
        this.sequenceNo = sequenceNo;
        this.organismName = organismName;
        this.colonyCount = colonyCount;
        this.significance = significance == null ? OrganismSignificance.PATHOGEN : significance;
        this.note = note;
    }

    public CultureSusceptibility addSusceptibility(CultureSusceptibility s) {
        s.attachTo(this);
        susceptibilities.add(s);
        return s;
    }

    public TestResult getResult() {
        return result;
    }

    public int getSequenceNo() {
        return sequenceNo;
    }

    public String getOrganismName() {
        return organismName;
    }

    public String getColonyCount() {
        return colonyCount;
    }

    public OrganismSignificance getSignificance() {
        return significance;
    }

    public String getNote() {
        return note;
    }

    public List<CultureSusceptibility> getSusceptibilities() {
        return susceptibilities;
    }
}
