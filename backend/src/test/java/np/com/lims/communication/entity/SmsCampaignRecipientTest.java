package np.com.lims.communication.entity;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SmsCampaignRecipientTest {

    @Test
    void retryMovesAFailedRecipientBackToPendingAndClearsItsOutcome() {
        SmsCampaign campaign = SmsCampaign.draft("CAMP000001", "Test campaign", null, "Hello", SmsCategory.GENERAL_ANNOUNCEMENT, null);
        SmsCampaignRecipient recipient = SmsCampaignRecipient.pending(1L, campaign, 42L, "9812345678", "Sita Rai", 0);
        recipient.markFailed(99L, "Samaya SMS is not configured for this organization.");
        assertThat(recipient.getStatus()).isEqualTo(SmsRecipientStatus.FAILED);

        recipient.retry();

        assertThat(recipient.getStatus()).isEqualTo(SmsRecipientStatus.PENDING);
        assertThat(recipient.getMessageId()).isNull();
        assertThat(recipient.getErrorMessage()).isNull();
        assertThat(recipient.getProcessedAt()).isNull();
    }

    @Test
    void retryRejectsARecipientThatNeverFailed() {
        SmsCampaign campaign = SmsCampaign.draft("CAMP000001", "Test campaign", null, "Hello", SmsCategory.GENERAL_ANNOUNCEMENT, null);
        SmsCampaignRecipient recipient = SmsCampaignRecipient.pending(1L, campaign, 42L, "9812345678", "Sita Rai", 0);

        assertThatThrownBy(recipient::retry).isInstanceOf(IllegalStateException.class);
    }
}
