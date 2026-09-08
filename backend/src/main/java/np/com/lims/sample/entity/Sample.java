package np.com.lims.sample.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Embedded;
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
import np.com.lims.catalog.entity.SpecimenType;
import np.com.lims.common.audit.BaseEntity;
import np.com.lims.common.exception.ApiException;
import np.com.lims.order.entity.LabOrder;
import np.com.lims.order.entity.LabOrderItem;
import np.com.lims.patient.entity.Patient;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "sample")
public class Sample extends BaseEntity {

    @Column(name = "accession_number", nullable = false, length = 24, updatable = false)
    private String accessionNumber;

    @Column(name = "barcode_value", nullable = false, length = 48, updatable = false)
    private String barcodeValue;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "lab_order_id", nullable = false)
    private LabOrder order;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @Enumerated(EnumType.STRING)
    @Column(name = "specimen_type", nullable = false, length = 32)
    private SpecimenType specimenType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private SampleStatus status = SampleStatus.AWAITING_COLLECTION;

    @Column(length = 120)
    private String container;

    @Column(name = "collection_site", length = 160)
    private String collectionSite;

    @Column(length = 500)
    private String notes;

    @Column(name = "collected_at")
    private Instant collectedAt;

    @Column(name = "collected_by", length = 100)
    private String collectedBy;

    @Column(name = "received_at")
    private Instant receivedAt;

    @Column(name = "received_by", length = 100)
    private String receivedBy;

    @Column(name = "rejected_at")
    private Instant rejectedAt;

    @Column(name = "rejected_by", length = 100)
    private String rejectedBy;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    @Embedded
    private SpecimenCondition condition = new SpecimenCondition();

    @OneToMany(mappedBy = "sample", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    private List<SampleItem> items = new ArrayList<>();

    @OneToMany(mappedBy = "sample", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("occurredAt ASC, id ASC")
    private List<SampleEvent> events = new ArrayList<>();

    protected Sample() {
    }

    public static Sample create(String accessionNumber, LabOrder order, SpecimenType specimenType, String actor) {
        Sample sample = new Sample();
        sample.accessionNumber = accessionNumber;
        sample.barcodeValue = accessionNumber;
        sample.order = order;
        sample.patient = order.getPatient();
        sample.specimenType = specimenType;
        sample.status = SampleStatus.AWAITING_COLLECTION;
        sample.events.add(new SampleEvent(sample, SampleEvent.Type.CREATED, null,
                SampleStatus.AWAITING_COLLECTION, actor, "Sample generated on order confirmation"));
        return sample;
    }

    public SampleItem addItem(LabOrderItem orderItem) {
        return addItem(orderItem, orderItem.getTest());
    }

    /** Add a performed test carried by this sample. For a profile order item this is a member test. */
    public SampleItem addItem(LabOrderItem orderItem, np.com.lims.catalog.entity.LabTest performedTest) {
        SampleItem item = new SampleItem(this, orderItem, performedTest);
        items.add(item);
        return item;
    }

    public void collect(String actor, String collectionSite, String container, String note) {
        transition(SampleStatus.COLLECTED, SampleEvent.Type.COLLECTED, actor, note);
        this.collectedAt = Instant.now();
        this.collectedBy = actor;
        this.collectionSite = collectionSite;
        this.container = container;
    }

    public void receive(String actor, String note, SpecimenCondition condition) {
        transition(SampleStatus.RECEIVED, SampleEvent.Type.RECEIVED, actor, note);
        this.receivedAt = Instant.now();
        this.receivedBy = actor;
        if (condition != null) {
            this.condition = condition;
        }
    }

    public SpecimenCondition getCondition() {
        return condition;
    }

    public void reject(String actor, String reason) {
        if (reason == null || reason.isBlank()) {
            throw ApiException.conflict("A rejection reason is required");
        }
        transition(SampleStatus.REJECTED, SampleEvent.Type.REJECTED, actor, reason);
        this.rejectedAt = Instant.now();
        this.rejectedBy = actor;
        this.rejectionReason = reason;
    }

    public void reopenForRecollection(String actor, String note) {
        transition(SampleStatus.AWAITING_COLLECTION, SampleEvent.Type.RECOLLECTION_REQUESTED, actor, note);
        this.collectedAt = null;
        this.collectedBy = null;
        this.receivedAt = null;
        this.receivedBy = null;
    }

    public void addNote(String actor, String note) {
        events.add(new SampleEvent(this, SampleEvent.Type.NOTE, status, status, actor, note));
    }

    private void transition(SampleStatus target, SampleEvent.Type type, String actor, String note) {
        if (!status.canTransitionTo(target)) {
            throw ApiException.invalidTransition(
                    "Sample " + accessionNumber + " cannot move from " + status + " to " + target);
        }
        SampleStatus from = this.status;
        this.status = target;
        events.add(new SampleEvent(this, type, from, target, actor, note));
    }

    public String getAccessionNumber() {
        return accessionNumber;
    }

    public String getBarcodeValue() {
        return barcodeValue;
    }

    public LabOrder getOrder() {
        return order;
    }

    public Patient getPatient() {
        return patient;
    }

    public SpecimenType getSpecimenType() {
        return specimenType;
    }

    public SampleStatus getStatus() {
        return status;
    }

    public String getContainer() {
        return container;
    }

    public String getCollectionSite() {
        return collectionSite;
    }

    public String getNotes() {
        return notes;
    }

    public Instant getCollectedAt() {
        return collectedAt;
    }

    public String getCollectedBy() {
        return collectedBy;
    }

    public Instant getReceivedAt() {
        return receivedAt;
    }

    public String getReceivedBy() {
        return receivedBy;
    }

    public Instant getRejectedAt() {
        return rejectedAt;
    }

    public String getRejectedBy() {
        return rejectedBy;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public List<SampleItem> getItems() {
        return items;
    }

    public List<SampleEvent> getEvents() {
        return events;
    }
}
