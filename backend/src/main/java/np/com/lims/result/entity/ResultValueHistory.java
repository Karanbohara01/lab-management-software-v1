package np.com.lims.result.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.Instant;

/** Immutable record of a single parameter value change on an already-entered result. */
@Entity
@Table(name = "result_value_history")
public class ResultValueHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "test_result_id", nullable = false)
    private TestResult result;

    @Column(name = "parameter_name", nullable = false, length = 160)
    private String parameterName;

    @Column(name = "old_value", length = 500)
    private String oldValue;

    @Column(name = "new_value", length = 500)
    private String newValue;

    @Column(length = 500)
    private String reason;

    @Column(name = "changed_by", nullable = false, length = 100)
    private String changedBy;

    @Column(name = "changed_at", nullable = false)
    private Instant changedAt;

    protected ResultValueHistory() {
    }

    ResultValueHistory(TestResult result, String parameterName, String oldValue, String newValue,
                       String reason, String changedBy) {
        this.result = result;
        this.parameterName = parameterName;
        this.oldValue = oldValue;
        this.newValue = newValue;
        this.reason = reason;
        this.changedBy = changedBy;
        this.changedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public String getParameterName() {
        return parameterName;
    }

    public String getOldValue() {
        return oldValue;
    }

    public String getNewValue() {
        return newValue;
    }

    public String getReason() {
        return reason;
    }

    public String getChangedBy() {
        return changedBy;
    }

    public Instant getChangedAt() {
        return changedAt;
    }
}
