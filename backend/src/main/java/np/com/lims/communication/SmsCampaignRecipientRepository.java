package np.com.lims.communication;

import np.com.lims.communication.entity.SmsCampaignRecipient;
import np.com.lims.communication.entity.SmsRecipientStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SmsCampaignRecipientRepository extends JpaRepository<SmsCampaignRecipient, Long> {

    /** One batch for the worker to process, in stable order, oldest-staged-column first. */
    List<SmsCampaignRecipient> findByCampaignIdAndStatusOrderBySequenceNoAsc(
            Long campaignId, SmsRecipientStatus status, Pageable pageable);

    Page<SmsCampaignRecipient> findByCampaignIdOrderBySequenceNoAsc(Long campaignId, Pageable pageable);

    /** Every failed recipient of one campaign — the retry action's own input list. */
    List<SmsCampaignRecipient> findByCampaignIdAndStatus(Long campaignId, SmsRecipientStatus status);

    long countByCampaignIdAndStatus(Long campaignId, SmsRecipientStatus status);

    long countByCampaignId(Long campaignId);
}
