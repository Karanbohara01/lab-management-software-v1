package np.com.lims.result.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import np.com.lims.common.audit.BaseEntity;
import np.com.lims.microbiology.entity.Antibiotic;

/** One antibiotic's susceptibility result for a {@link CultureIsolate}. */
@Entity
@Table(name = "culture_susceptibility")
public class CultureSusceptibility extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "culture_isolate_id", nullable = false)
    private CultureIsolate isolate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "antibiotic_id")
    private Antibiotic antibiotic;

    @Column(name = "antibiotic_name", nullable = false, length = 120)
    private String antibioticName;

    @Column(name = "sequence_no", nullable = false)
    private int sequenceNo = 1;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 8)
    private Susceptibility interpretation = Susceptibility.NT;

    @Column(name = "mic_value", length = 24)
    private String micValue;

    @Column(name = "zone_mm", length = 24)
    private String zoneMm;

    @Enumerated(EnumType.STRING)
    @Column(length = 24)
    private SusceptibilityMethod method;

    protected CultureSusceptibility() {
    }

    public CultureSusceptibility(Antibiotic antibiotic, String antibioticName, int sequenceNo,
                                 Susceptibility interpretation, String micValue, String zoneMm,
                                 SusceptibilityMethod method) {
        this.antibiotic = antibiotic;
        this.antibioticName = antibioticName;
        this.sequenceNo = sequenceNo;
        this.interpretation = interpretation == null ? Susceptibility.NT : interpretation;
        this.micValue = micValue;
        this.zoneMm = zoneMm;
        this.method = method;
    }

    void attachTo(CultureIsolate isolate) {
        this.isolate = isolate;
    }

    public CultureIsolate getIsolate() {
        return isolate;
    }

    public Antibiotic getAntibiotic() {
        return antibiotic;
    }

    public String getAntibioticName() {
        return antibioticName;
    }

    public int getSequenceNo() {
        return sequenceNo;
    }

    public Susceptibility getInterpretation() {
        return interpretation;
    }

    public String getMicValue() {
        return micValue;
    }

    public String getZoneMm() {
        return zoneMm;
    }

    public SusceptibilityMethod getMethod() {
        return method;
    }
}
