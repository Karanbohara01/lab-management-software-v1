package np.com.lims.communication.entity;

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
import np.com.lims.common.tenant.TenantContext;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Filter;

import java.time.Instant;

/**
 * The one table every SMS attempt — manually sent, campaign-sent, or automation-fired — writes a
 * row to, so the feature's own requirement ("every SMS attempt should have a corresponding
 * database record") holds structurally rather than by convention. Deliberately not a
 * {@code BaseEntity}: this is a high-volume, write-once, append-only log (same reasoning as
 * {@code Notification}), not a versioned/mutable domain object — see that entity's own javadoc for
 * the precedent.
 */
@Entity
@Table(name = "sms_message")
@Filter(name = "tenantFilter", condition = "organization_id = :tenantId")
public class SmsMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "organization_id", nullable = false, updatable = false)
    private Long organizationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "campaign_id")
    private SmsCampaign campaign;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "automation_rule_id")
    private SmsAutomationRule automationRule;

    @Column(name = "patient_id")
    private Long patientId;

    @Column(name = "recipient_phone", nullable = false, length = 20)
    private String recipientPhone;

    @Column(name = "recipient_name", length = 160)
    private String recipientName;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 32)
    private SmsCategory category;

    @Column(name = "message_body", nullable = false, length = 1000)
    private String messageBody;

    @Column(name = "segment_count", nullable = false)
    private int segmentCount;

    @Column(name = "encoding", nullable = false, length = 8)
    private String encoding;

    @Enumerated(EnumType.STRING)
    @Column(name = "provider", nullable = false, length = 16)
    private SmsProvider provider;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 16)
    private SmsMessageStatus status;

    @Column(name = "provider_reference", length = 120)
    private String providerReference;

    @Column(name = "error_code", length = 40)
    private String errorCode;

    @Column(name = "error_message", length = 500)
    private String errorMessage;

    @Column(name = "sent_by", length = 100)
    private String sentBy;

    @Column(name = "sent_at")
    private Instant sentAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected SmsMessage() {
    }

    /** A message about to be attempted — status is set immediately after by {@link #markSent}/{@link #markFailed}. */
    public static SmsMessage attempt(Long patientId, String recipientPhone, String recipientName, SmsCategory category,
                                     String messageBody, int segmentCount, String encoding, SmsProvider provider,
                                     String sentBy, SmsCampaign campaign, SmsAutomationRule automationRule) {
        SmsMessage m = new SmsMessage();
        m.organizationId = TenantContext.require();
        m.patientId = patientId;
        m.recipientPhone = recipientPhone;
        m.recipientName = recipientName;
        m.category = category;
        m.messageBody = messageBody;
        m.segmentCount = segmentCount;
        m.encoding = encoding;
        m.provider = provider;
        m.sentBy = sentBy;
        m.campaign = campaign;
        m.automationRule = automationRule;
        m.status = SmsMessageStatus.QUEUED;
        return m;
    }

    public void markSent(String providerReference) {
        this.status = SmsMessageStatus.SENT;
        this.providerReference = providerReference;
        this.sentAt = Instant.now();
    }

    public void markFailed(String errorCode, String errorMessage) {
        this.status = SmsMessageStatus.FAILED;
        this.errorCode = errorCode;
        this.errorMessage = errorMessage;
        this.sentAt = Instant.now();
    }

    /** Only ever called from a real, confirmed delivery-report signal — see the class javadoc. */
    public void markDelivered() {
        this.status = SmsMessageStatus.DELIVERED;
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

    public SmsAutomationRule getAutomationRule() {
        return automationRule;
    }

    public Long getPatientId() {
        return patientId;
    }

    public String getRecipientPhone() {
        return recipientPhone;
    }

    public String getRecipientName() {
        return recipientName;
    }

    public SmsCategory getCategory() {
        return category;
    }

    public String getMessageBody() {
        return messageBody;
    }

    public int getSegmentCount() {
        return segmentCount;
    }

    public String getEncoding() {
        return encoding;
    }

    public SmsProvider getProvider() {
        return provider;
    }

    public SmsMessageStatus getStatus() {
        return status;
    }

    public String getProviderReference() {
        return providerReference;
    }

    public String getErrorCode() {
        return errorCode;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public String getSentBy() {
        return sentBy;
    }

    public Instant getSentAt() {
        return sentAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
