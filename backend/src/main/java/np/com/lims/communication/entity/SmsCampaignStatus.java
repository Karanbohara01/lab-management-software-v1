package np.com.lims.communication.entity;

/**
 * A campaign's lifecycle. {@code DRAFT} -&gt; ({@code SCHEDULED} ->) {@code QUEUED} -&gt;
 * {@code PROCESSING} -&gt; one of {@code COMPLETED} / {@code PARTIALLY_COMPLETED} / {@code FAILED}
 * / {@code CANCELLED}. A draft never had recipients staged; queuing a campaign (immediately, or
 * because its scheduled time arrived) is what computes and writes its {@code sms_campaign_recipient}
 * rows, so editing a still-draft campaign's filter never leaves stale staged rows behind.
 */
public enum SmsCampaignStatus {
    DRAFT,
    SCHEDULED,
    QUEUED,
    PROCESSING,
    COMPLETED,
    PARTIALLY_COMPLETED,
    FAILED,
    CANCELLED;

    public boolean isTerminal() {
        return this == COMPLETED || this == PARTIALLY_COMPLETED || this == FAILED || this == CANCELLED;
    }
}
