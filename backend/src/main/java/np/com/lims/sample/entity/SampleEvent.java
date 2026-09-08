package np.com.lims.sample.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.Instant;

/** Immutable entry in a sample's tracking timeline. */
@Entity
@Table(name = "sample_event")
public class SampleEvent {

    public enum Type {
        CREATED, COLLECTED, RECEIVED, REJECTED, RECOLLECTION_REQUESTED, NOTE
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sample_id", nullable = false)
    private Sample sample;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 32)
    private Type eventType;

    @Enumerated(EnumType.STRING)
    @Column(name = "from_status", length = 32)
    private SampleStatus fromStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "to_status", length = 32)
    private SampleStatus toStatus;

    @Column(nullable = false, length = 100)
    private String actor;

    @Column(length = 500)
    private String note;

    @Column(name = "occurred_at", nullable = false)
    private Instant occurredAt;

    protected SampleEvent() {
    }

    SampleEvent(Sample sample, Type eventType, SampleStatus fromStatus, SampleStatus toStatus, String actor, String note) {
        this.sample = sample;
        this.eventType = eventType;
        this.fromStatus = fromStatus;
        this.toStatus = toStatus;
        this.actor = actor;
        this.note = note;
        this.occurredAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public Type getEventType() {
        return eventType;
    }

    public SampleStatus getFromStatus() {
        return fromStatus;
    }

    public SampleStatus getToStatus() {
        return toStatus;
    }

    public String getActor() {
        return actor;
    }

    public String getNote() {
        return note;
    }

    public Instant getOccurredAt() {
        return occurredAt;
    }
}
