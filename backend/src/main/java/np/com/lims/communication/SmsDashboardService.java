package np.com.lims.communication;

import np.com.lims.communication.dto.CommunicationDtos.DashboardResponse;
import np.com.lims.communication.dto.CommunicationDtos.GatewayStatusResponse;
import np.com.lims.communication.entity.SmsMessageStatus;
import np.com.lims.communication.gateway.SmsGatewayRegistry;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

/**
 * Real numbers only, straight from {@code sms_message}/{@code sms_campaign} — no fabricated
 * balance, delivery rate, or activity figures (the feature's own explicit requirement). A
 * "delivered" count here means the narrow {@code SmsMessageStatus#DELIVERED} state, not every
 * successfully-sent message — see that enum's javadoc for why those are kept distinct.
 */
@Service
public class SmsDashboardService {

    private static final ZoneId KATHMANDU = ZoneId.of("Asia/Kathmandu");

    private final SmsMessageRepository messageRepository;
    private final SmsCampaignRepository campaignRepository;
    private final SmsGatewayRegistry gatewayRegistry;

    public SmsDashboardService(SmsMessageRepository messageRepository, SmsCampaignRepository campaignRepository,
                               SmsGatewayRegistry gatewayRegistry) {
        this.messageRepository = messageRepository;
        this.campaignRepository = campaignRepository;
        this.gatewayRegistry = gatewayRegistry;
    }

    @Transactional(readOnly = true)
    public DashboardResponse summary() {
        long delivered = messageRepository.countByStatus(SmsMessageStatus.DELIVERED);
        long sent = messageRepository.countByStatus(SmsMessageStatus.SENT);
        long failed = messageRepository.countByStatus(SmsMessageStatus.FAILED);
        long pending = messageRepository.countByStatus(SmsMessageStatus.QUEUED);
        long total = delivered + sent + failed + pending;
        long attempted = delivered + sent + failed;

        Instant startOfToday = LocalDate.now(KATHMANDU).atStartOfDay(KATHMANDU).toInstant();
        Instant startOfMonth = LocalDate.now(KATHMANDU).withDayOfMonth(1).atStartOfDay(KATHMANDU).toInstant();

        double successRate = attempted == 0 ? 0.0 : Math.round(((delivered + sent) * 1000.0) / attempted) / 10.0;

        var gateways = gatewayRegistry.statuses().stream()
                .map(s -> new GatewayStatusResponse(s.provider(), s.label(), s.configured()))
                .toList();

        return new DashboardResponse(total, delivered, sent, failed, pending,
                messageRepository.sumSegmentsSentSince(startOfToday), messageRepository.sumSegmentsSentSince(startOfMonth),
                campaignRepository.countByStatusNot(np.com.lims.communication.entity.SmsCampaignStatus.DRAFT),
                successRate, gateways);
    }
}
