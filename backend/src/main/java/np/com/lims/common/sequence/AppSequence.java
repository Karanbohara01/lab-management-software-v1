package np.com.lims.common.sequence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "app_sequence")
public class AppSequence {

    @Id
    @Column(name = "name", length = 64)
    private String name;

    @Column(name = "next_value", nullable = false)
    private long nextValue;

    protected AppSequence() {
    }

    static AppSequence start(String name) {
        AppSequence sequence = new AppSequence();
        sequence.name = name;
        sequence.nextValue = 1L;
        return sequence;
    }

    public String getName() {
        return name;
    }

    public long getNextValue() {
        return nextValue;
    }

    public void setNextValue(long nextValue) {
        this.nextValue = nextValue;
    }
}
