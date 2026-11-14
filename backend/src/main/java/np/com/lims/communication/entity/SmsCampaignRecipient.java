package np.com.lims.communication.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

/**
 * One staged recipient of one campaign. Deliberately NOT a {@code BaseEntity} (no version/audit
 * columns) — same reasoning as {@code PatientImportRow}: there can be thousands of these per
 * campaign and they are write-once-then-updated-by-the-worker rows, not independently audited
 * domain objects. Tenant isolation is inherited through {@code campaign} (no own Hibernate filter
 * needed — every query reaches these rows via a tenant-filtered {@code SmsCampaign} first).
 */
@Entity
@Table(name = "sms_campaign_recipient")
public class SmsCampaignRecipient {

    @Id
    @jakarta.persistence.GeneratedValue(strategy = jakarta.persistence.GenerationType.IDENTITY)
    private Long id;

    @Column(name = "organization_id", nullable = false, updatable = false)
    private Long organizationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "campaign_id", nullable = false, updatable = false)
    private SmsCampaign campaign;

    @Column(name = "patient_id")
    private Long patientId;

    @Column(name = "phone", nullable = false, length = 20)
    private String phone;

    @Column(name = "name", length = 160)
    private String name;

    @Column(name = "sequence_no", nullable = false)
    private int sequenceNo;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 24)
    private SmsRecipientStatus status;

    @Column(name = "message_id")
    private Long messageId;

    @Column(name = "error_message", length = 500)
    private String errorMessage;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "processed_at")
    private Instant processedAt;

    protected SmsCampaignRecipient() {
    }

    public static SmsCampaignRecipient pending(Long organizationId, SmsCampaign campaign, Long patientId,
                                               String phone, String name, int sequenceNo) {
        SmsCampaignRecipient r = new SmsCampaignRecipient();
        r.organizationId = organizationId;
        r.campaign = campaign;
        r.patientId = patientId;
        r.phone = phone;
        r.name = name;
        r.sequenceNo = sequenceNo;
        r.status = SmsRecipientStatus.PENDING;
        return r;
    }

    public static SmsCampaignRecipient skipped(Long organizationId, SmsCampaign campaign, Long patientId,
                                               String phone, String name, int sequenceNo,
                                               SmsRecipientStatus reason, String errorMessage) {
        SmsCampaignRecipient r = pending(organizationId, campaign, patientId, phone, name, sequenceNo);
        r.status = reason;
        r.errorMessage = errorMessage;
        r.processedAt = Instant.now();
        return r;
    }

    public void markSent(Long messageId) {
        this.status = SmsRecipientStatus.SENT;
        this.messageId = messageId;
        this.processedAt = Instant.now();
    }

    public void markFailed(Long messageId, String errorMessage) {
        this.status = SmsRecipientStatus.FAILED;
        this.messageId = messageId;
        this.errorMessage = errorMessage;
        this.processedAt = Instant.now();
    }

    /** Moves a failed recipient back to pending so the campaign worker picks it up again — see {@code SmsCampaignService#retryFailed}. */
    public void retry() {
        if (status != SmsRecipientStatus.FAILED) {
            throw new IllegalStateException("Only a failed recipient can be retried (was " + status + ")");
        }
        this.status = SmsRecipientStatus.PENDING;
        this.messageId = null;
        this.errorMessage = null;
        this.processedAt = null;
    }

    public Long getId() {
        return id;
    }

    public Long getOrganizationId() {
        return organizationId;
    }

    public SmsCampaign getCampaign() {
        return campaign;
    }

    public Long getPatientId() {
        return patientId;
    }

    public String getPhone() {
        return phone;
    }

    public String getName() {
        return name;
    }

    public int getSequenceNo() {
        return sequenceNo;
    }

    public SmsRecipientStatus getStatus() {
        return status;
    }

    public Long getMessageId() {
        return messageId;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getProcessedAt() {
        return processedAt;
    }
}
