package np.com.lims.communication.entity;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SmsCampaignTest {

    private SmsCampaign draftCampaign() {
        return SmsCampaign.draft("CAMP000001", "Test campaign", null, "Hello there", SmsCategory.GENERAL_ANNOUNCEMENT, null);
    }

    @Test
    void retryFailedRequeuesAPartiallyCompletedCampaign() {
        SmsCampaign campaign = draftCampaign();
        campaign.stage(3, 30, null);
        campaign.claim("worker-1");
        campaign.recordBatch(1, 2);
        campaign.complete();
        assertThat(campaign.getStatus()).isEqualTo(SmsCampaignStatus.PARTIALLY_COMPLETED);

        campaign.retryFailed(2);

        assertThat(campaign.getStatus()).isEqualTo(SmsCampaignStatus.QUEUED);
        assertThat(campaign.getFailedCount()).isZero();
        assertThat(campaign.getSentCount()).isEqualTo(1); // already-sent count is history, not reset
        assertThat(campaign.getCompletedAt()).isNull();
        assertThat(campaign.getFailureMessage()).isNull();
    }

    @Test
    void retryFailedRequeuesAFullyFailedCampaign() {
        SmsCampaign campaign = draftCampaign();
        campaign.stage(3, 30, null);
        campaign.claim("worker-1");
        campaign.recordBatch(0, 3);
        campaign.complete();
        assertThat(campaign.getStatus()).isEqualTo(SmsCampaignStatus.FAILED);

        campaign.retryFailed(3);

        assertThat(campaign.getStatus()).isEqualTo(SmsCampaignStatus.QUEUED);
        assertThat(campaign.getFailedCount()).isZero();
    }

    @Test
    void retryFailedRejectsAnUnfinishedCampaign() {
        SmsCampaign campaign = draftCampaign();
        campaign.stage(3, 30, null);
        assertThat(campaign.getStatus()).isEqualTo(SmsCampaignStatus.QUEUED);

        assertThatThrownBy(() -> campaign.retryFailed(1)).isInstanceOf(IllegalStateException.class);
    }

    @Test
    void retryFailedRejectsACompletedCampaignWithNoFailures() {
        SmsCampaign campaign = draftCampaign();
        campaign.stage(2, 20, null);
        campaign.claim("worker-1");
        campaign.recordBatch(2, 0);
        campaign.complete();
        assertThat(campaign.getStatus()).isEqualTo(SmsCampaignStatus.COMPLETED);

        assertThatThrownBy(() -> campaign.retryFailed(1)).isInstanceOf(IllegalStateException.class);
    }
}
