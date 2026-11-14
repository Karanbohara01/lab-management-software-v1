package np.com.lims.communication.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import np.com.lims.common.audit.BaseEntity;
import np.com.lims.common.tenant.TenantContext;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;

/**
 * A bulk SMS send. Follows the exact stage-then-lease pattern {@code PatientImportJob} uses for
 * the same reason: sending to hundreds or thousands of recipients cannot happen inside one HTTP
 * request, so a campaign is staged (its {@code SmsCampaignRecipient} rows computed and written)
 * then claimed and worked through in batches by {@code SmsCampaignWorker}, with a heartbeat so a
 * restarted server resumes an in-flight campaign instead of losing or duplicating it.
 */
@Entity
@Table(name = "sms_campaign")
@Filter(name = "tenantFilter", condition = "organization_id = :tenantId")
public class SmsCampaign extends BaseEntity {

    @Column(name = "organization_id", nullable = false, updatable = false)
    private Long organizationId;

    @Column(name = "campaign_number", nullable = false, length = 24, updatable = false)
    private String campaignNumber;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id")
    private SmsTemplate template;

    @Column(name = "message_body", nullable = false, length = 1000)
    private String messageBody;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 32)
    private SmsCategory category;

    /** The recipient-selection criteria chosen, as JSON — kept for the campaign report. */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "recipient_filter")
    private String recipientFilter;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 24)
    private SmsCampaignStatus status;

    @Column(name = "total_recipients", nullable = false)
    private int totalRecipients;
    @Column(name = "sent_count", nullable = false)
    private int sentCount;
    @Column(name = "failed_count", nullable = false)
    private int failedCount;
    @Column(name = "estimated_segments", nullable = false)
    private int estimatedSegments;

    @Column(name = "scheduled_at")
    private Instant scheduledAt;
    @Column(name = "time_zone", nullable = false, length = 40)
    private String timeZone = "Asia/Kathmandu";

    @Column(name = "claimed_by", length = 100)
    private String claimedBy;
    @Column(name = "claimed_at")
    private Instant claimedAt;
    @Column(name = "heartbeat_at")
    private Instant heartbeatAt;

    @Column(name = "started_at")
    private Instant startedAt;
    @Column(name = "completed_at")
    private Instant completedAt;
    @Column(name = "cancelled_at")
    private Instant cancelledAt;
    @Column(name = "cancel_requested", nullable = false)
    private boolean cancelRequested;
    @Column(name = "failure_message", length = 1000)
    private String failureMessage;

    protected SmsCampaign() {
    }

    public static SmsCampaign draft(String campaignNumber, String name, SmsTemplate template, String messageBody,
                                    SmsCategory category, String recipientFilterJson) {
        SmsCampaign c = new SmsCampaign();
        c.campaignNumber = campaignNumber;
        c.name = name;
        c.template = template;
        c.messageBody = messageBody;
        c.category = category;
        c.recipientFilter = recipientFilterJson;
        c.status = SmsCampaignStatus.DRAFT;
        return c;
    }

    /** Staging recipients moves a draft straight to QUEUED (send now) or SCHEDULED (send later). */
    public void stage(int totalRecipients, int estimatedSegments, Instant scheduledAt) {
        if (status != SmsCampaignStatus.DRAFT) {
            throw new IllegalStateException("Only a draft campaign can be staged (was " + status + ")");
        }
        this.totalRecipients = totalRecipients;
        this.estimatedSegments = estimatedSegments;
        this.scheduledAt = scheduledAt;
        this.status = scheduledAt != null ? SmsCampaignStatus.SCHEDULED : SmsCampaignStatus.QUEUED;
    }

    public void claim(String worker) {
        this.claimedBy = worker;
        this.claimedAt = Instant.now();
        this.heartbeatAt = Instant.now();
        if (status == SmsCampaignStatus.QUEUED || status == SmsCampaignStatus.SCHEDULED) {
            this.status = SmsCampaignStatus.PROCESSING;
            this.startedAt = Instant.now();
        }
    }

    public void heartbeat() {
        this.heartbeatAt = Instant.now();
    }

    public void recordBatch(int sent, int failed) {
        this.sentCount += sent;
        this.failedCount += failed;
        heartbeat();
    }

    public void complete() {
        this.status = (failedCount > 0 && sentCount > 0) ? SmsCampaignStatus.PARTIALLY_COMPLETED
                : failedCount > 0 && sentCount == 0 ? SmsCampaignStatus.FAILED
                : SmsCampaignStatus.COMPLETED;
        this.completedAt = Instant.now();
        releaseClaim();
    }

    public void fail(String message) {
        this.status = SmsCampaignStatus.FAILED;
        this.failureMessage = message;
        this.completedAt = Instant.now();
        releaseClaim();
    }

    /**
     * Requeues this campaign's failed recipients — see {@code SmsCampaignService#retryFailed}, which
     * is the only caller: it resets exactly {@code count} recipient rows back to PENDING first, then
     * calls this to put the campaign itself back in the worker's claim queue. {@code failedCount} is
     * reduced by {@code count}, not zeroed, since some of them may fail again on the retry and
     * re-increment it the normal way through {@code recordBatch}.
     */
    public void retryFailed(int count) {
        if (status != SmsCampaignStatus.FAILED && status != SmsCampaignStatus.PARTIALLY_COMPLETED) {
            throw new IllegalStateException(
                    "Only a failed or partially-completed campaign can retry its failures (was " + status + ")");
        }
        this.failedCount = Math.max(0, this.failedCount - count);
        this.completedAt = null;
        this.failureMessage = null;
        this.status = SmsCampaignStatus.QUEUED;
    }

    public void requestCancel() {
        if (status.isTerminal()) {
            throw new IllegalStateException("Campaign already finished (" + status + ") — nothing to cancel");
        }
        this.cancelRequested = true;
        if (status == SmsCampaignStatus.DRAFT || status == SmsCampaignStatus.SCHEDULED) {
            this.status = SmsCampaignStatus.CANCELLED;
            this.cancelledAt = Instant.now();
        }
        // QUEUED/PROCESSING: the worker itself observes cancelRequested between batches and
        // finishes the transition — see SmsCampaignWorker.
    }

    public void acknowledgeCancelled() {
        this.status = SmsCampaignStatus.CANCELLED;
        this.cancelledAt = Instant.now();
        releaseClaim();
    }

    private void releaseClaim() {
        this.claimedBy = null;
        this.claimedAt = null;
        this.heartbeatAt = null;
    }

    @PrePersist
    private void assignTenant() {
        if (organizationId == null) {
            organizationId = TenantContext.require();
        }
    }

    public Long getOrganizationId() {
        return organizationId;
    }

    public String getCampaignNumber() {
        return campaignNumber;
    }

    public String getName() {
        return name;
    }

    public SmsTemplate getTemplate() {
        return template;
    }

    public String getMessageBody() {
        return messageBody;
    }

    public SmsCategory getCategory() {
        return category;
    }

    public String getRecipientFilter() {
        return recipientFilter;
    }

    public SmsCampaignStatus getStatus() {
        return status;
    }

    public int getTotalRecipients() {
        return totalRecipients;
    }

    public int getSentCount() {
        return sentCount;
    }

    public int getFailedCount() {
        return failedCount;
    }

    public int getEstimatedSegments() {
        return estimatedSegments;
    }

    public Instant getScheduledAt() {
        return scheduledAt;
    }

    public String getTimeZone() {
        return timeZone;
    }

    public String getClaimedBy() {
        return claimedBy;
    }

    public Instant getHeartbeatAt() {
        return heartbeatAt;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }

    public Instant getCancelledAt() {
        return cancelledAt;
    }

    public boolean isCancelRequested() {
        return cancelRequested;
    }

    public String getFailureMessage() {
        return failureMessage;
    }
}
