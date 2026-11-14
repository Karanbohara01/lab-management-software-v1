package np.com.lims.communication;

import np.com.lims.communication.entity.SmsCampaign;
import np.com.lims.communication.entity.SmsCampaignStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface SmsCampaignRepository extends JpaRepository<SmsCampaign, Long> {

    Page<SmsCampaign> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Optional<SmsCampaign> findByCampaignNumber(String campaignNumber);

    /**
     * Across every organization, ignoring the tenant filter — the batch worker's own claim query,
     * same reasoning as {@code SmsAutomationRuleRepository#findEnabledOrganizationIds}: it runs
     * with no tenant context of its own. A campaign is claimable when it is QUEUED (never
     * claimed), or SCHEDULED with its time arrived, or PROCESSING with a stale heartbeat (a
     * previous worker died mid-campaign).
     */
    @Query(value = "SELECT id FROM sms_campaign WHERE "
            + "(status = 'QUEUED') OR "
            + "(status = 'SCHEDULED' AND scheduled_at <= :now) OR "
            + "(status = 'PROCESSING' AND (heartbeat_at IS NULL OR heartbeat_at < :staleBefore)) "
            + "ORDER BY COALESCE(scheduled_at, created_at) ASC",
            nativeQuery = true)
    List<Long> findClaimableIds(Instant now, Instant staleBefore);

    List<SmsCampaign> findByStatusIn(List<SmsCampaignStatus> statuses);

    long countByStatusNot(SmsCampaignStatus status);
}
