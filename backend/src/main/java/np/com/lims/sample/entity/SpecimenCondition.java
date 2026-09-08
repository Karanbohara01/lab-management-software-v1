package np.com.lims.sample.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

/** Condition of a specimen at receipt. Carried onto results and printed on the report. */
@Embeddable
public class SpecimenCondition {

    @Column(nullable = false)
    private boolean haemolysed;

    @Column(nullable = false)
    private boolean lipaemic;

    @Column(nullable = false)
    private boolean icteric;

    @Column(nullable = false)
    private boolean clotted;

    @Column(name = "insufficient_volume", nullable = false)
    private boolean insufficientVolume;

    @Column(name = "wrong_container", nullable = false)
    private boolean wrongContainer;

    @Column(name = "condition_note", length = 300)
    private String note;

    public SpecimenCondition() {
    }

    public void update(boolean haemolysed, boolean lipaemic, boolean icteric, boolean clotted,
                       boolean insufficientVolume, boolean wrongContainer, String note) {
        this.haemolysed = haemolysed;
        this.lipaemic = lipaemic;
        this.icteric = icteric;
        this.clotted = clotted;
        this.insufficientVolume = insufficientVolume;
        this.wrongContainer = wrongContainer;
        this.note = note;
    }

    public boolean isAcceptable() {
        return !haemolysed && !lipaemic && !icteric && !clotted && !insufficientVolume && !wrongContainer
                && !StringUtils.hasText(note);
    }

    /** Human-readable list for display and reports. */
    public List<String> labels() {
        List<String> out = new ArrayList<>();
        if (haemolysed) out.add("Haemolysed");
        if (lipaemic) out.add("Lipaemic");
        if (icteric) out.add("Icteric");
        if (clotted) out.add("Clotted");
        if (insufficientVolume) out.add("Insufficient volume");
        if (wrongContainer) out.add("Wrong container");
        return out;
    }

    public String summary() {
        List<String> labels = labels();
        String joined = String.join(", ", labels);
        if (StringUtils.hasText(note)) {
            joined = joined.isEmpty() ? note : joined + " — " + note;
        }
        return joined;
    }

    public boolean isHaemolysed() {
        return haemolysed;
    }

    public boolean isLipaemic() {
        return lipaemic;
    }

    public boolean isIcteric() {
        return icteric;
    }

    public boolean isClotted() {
        return clotted;
    }

    public boolean isInsufficientVolume() {
        return insufficientVolume;
    }

    public boolean isWrongContainer() {
        return wrongContainer;
    }

    public String getNote() {
        return note;
    }
}
