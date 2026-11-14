package np.com.lims.communication;

import np.com.lims.common.tenant.TenantContext;
import np.com.lims.communication.entity.SmsCampaign;
import np.com.lims.communication.entity.SmsCampaignRecipient;
import np.com.lims.communication.entity.SmsMessage;
import np.com.lims.communication.entity.SmsMessageStatus;
import np.com.lims.communication.entity.SmsRecipientStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.TransactionException;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * The background worker that actually sends campaign SMS, in batches, across every organization.
 * Built on the exact same lease/claim-and-poll shape {@code PatientImportWorker} uses, for the
 * same reason: sending to thousands of recipients cannot happen inside one HTTP request, and a
 * server restarted mid-campaign must resume it, not lose or duplicate it.
 *
 * <p>Rate limiting: Samaya SMS documents no bulk-send endpoint (see {@code SamayaSmsGateway}'s
 * javadoc), so one message means one real HTTP request to the provider; {@code sendDelayMs} is a
 * small deliberate pause between requests within a batch so a large campaign doesn't hammer the
 * gateway in a tight loop.
 */
@Component
public class SmsCampaignWorker {

    private static final Logger log = LoggerFactory.getLogger(SmsCampaignWorker.class);

    private final SmsCampaignRepository campaignRepository;
    private final SmsCampaignRecipientRepository recipientRepository;
    private final SmsMessageService messageService;
    private final int batchSize;
    private final long sendDelayMs;
    private final Duration staleLeaseTimeout;
    private final String workerId;
    private final TransactionTemplate transaction;

    public SmsCampaignWorker(SmsCampaignRepository campaignRepository, SmsCampaignRecipientRepository recipientRepository,
                             SmsMessageService messageService, PlatformTransactionManager transactionManager,
                             @Value("${lims.sms.campaign.batch-size:50}") int batchSize,
                             @Value("${lims.sms.campaign.send-delay-ms:200}") long sendDelayMs,
                             @Value("${lims.sms.campaign.stale-lease-timeout:PT5M}") Duration staleLeaseTimeout) {
        this.campaignRepository = campaignRepository;
        this.recipientRepository = recipientRepository;
        this.messageService = messageService;
        this.batchSize = Math.max(1, batchSize);
        this.sendDelayMs = Math.max(0, sendDelayMs);
        this.staleLeaseTimeout = staleLeaseTimeout;
        this.workerId = workerName();
        this.transaction = new TransactionTemplate(transactionManager);
        this.transaction.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    private static String workerName() {
        try {
            return java.net.InetAddress.getLocalHost().getHostName() + ":" + ProcessHandle.current().pid();
        } catch (Exception e) {
            return "worker:" + ProcessHandle.current().pid();
        }
    }

    @Scheduled(cron = "${lims.sms.campaign.worker-cron:*/5 * * * * *}")
    public void pump() {
        SmsCampaign campaign = claimNext();
        if (campaign == null) {
            return;
        }
        Long orgId = campaign.getOrganizationId();
        try {
            TenantContext.set(orgId);
            processBatch(campaign.getId());
        } catch (Exception e) {
            log.error("SMS campaign {} failed", campaign.getId(), e);
            transaction.executeWithoutResult(status -> campaignRepository.findById(campaign.getId())
                    .ifPresent(c -> campaignRepository.save(failSafely(c,
                            "The campaign stopped unexpectedly. Recipients not yet sent were left pending."))));
        } finally {
            TenantContext.clear();
        }
    }

    private static SmsCampaign failSafely(SmsCampaign c, String message) {
        c.fail(message);
        return c;
    }

    private SmsCampaign claimNext() {
        List<Long> candidateIds = campaignRepository.findClaimableIds(Instant.now(), Instant.now().minus(staleLeaseTimeout));
        for (Long id : candidateIds) {
            SmsCampaign claimed = tryClaim(id);
            if (claimed != null) {
                return claimed;
            }
        }
        return null;
    }

    private SmsCampaign tryClaim(Long id) {
        Instant staleBefore = Instant.now().minus(staleLeaseTimeout);
        try {
            return transaction.execute(status -> campaignRepository.findById(id)
                    .filter(c -> !c.getStatus().isTerminal())
                    .filter(c -> c.getClaimedBy() == null || workerId.equals(c.getClaimedBy())
                            || c.getHeartbeatAt() == null || c.getHeartbeatAt().isBefore(staleBefore))
                    .map(c -> {
                        if (c.isCancelRequested()) {
                            c.acknowledgeCancelled();
                        } else {
                            c.claim(workerId);
                        }
                        return campaignRepository.saveAndFlush(c);
                    })
                    .orElse(null));
        } catch (OptimisticLockingFailureException | TransactionException e) {
            return null;
        }
    }

    /** One batch, in its own transaction per recipient so a single gateway hiccup never rolls back the whole batch. */
    private void processBatch(Long campaignId) {
        List<SmsCampaignRecipient> batch = transaction.execute(status -> recipientRepository
                .findByCampaignIdAndStatusOrderBySequenceNoAsc(campaignId, SmsRecipientStatus.PENDING,
                        PageRequest.of(0, batchSize)));
        if (batch == null || batch.isEmpty()) {
            finishIfDone(campaignId);
            return;
        }

        int sent = 0;
        int failed = 0;
        for (SmsCampaignRecipient recipient : batch) {
            if (isCancelRequested(campaignId)) {
                break;
            }
            boolean ok = sendOne(campaignId, recipient.getId());
            if (ok) {
                sent++;
            } else {
                failed++;
            }
            if (sendDelayMs > 0) {
                try {
                    Thread.sleep(sendDelayMs);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }

        int finalSent = sent;
        int finalFailed = failed;
        transaction.executeWithoutResult(status -> campaignRepository.findById(campaignId).ifPresent(c -> {
            c.recordBatch(finalSent, finalFailed);
            campaignRepository.save(c);
        }));
        finishIfDone(campaignId);
    }

    private boolean sendOne(Long campaignId, Long recipientId) {
        return Boolean.TRUE.equals(transaction.execute(status -> {
            SmsCampaignRecipient recipient = recipientRepository.findById(recipientId).orElse(null);
            SmsCampaign campaign = campaignRepository.findById(campaignId).orElse(null);
            if (recipient == null || campaign == null) {
                return false;
            }
            String body = SmsPlaceholderResolver.resolve(campaign.getMessageBody(),
                    Map.of("patientName", recipient.getName() == null ? "" : recipient.getName()));
            SmsMessage message = messageService.send(SmsMessageService.SendCommand.campaign(
                    recipient.getPatientId(), recipient.getPhone(), recipient.getName(), campaign.getCategory(),
                    body, campaign));
            boolean ok = message.getStatus() == SmsMessageStatus.SENT || message.getStatus() == SmsMessageStatus.DELIVERED;
            if (ok) {
                recipient.markSent(message.getId());
            } else {
                recipient.markFailed(message.getId(), message.getErrorMessage());
            }
            recipientRepository.save(recipient);
            return ok;
        }));
    }

    private boolean isCancelRequested(Long campaignId) {
        return Boolean.TRUE.equals(transaction.execute(status ->
                campaignRepository.findById(campaignId).map(SmsCampaign::isCancelRequested).orElse(true)));
    }

    private void finishIfDone(Long campaignId) {
        transaction.executeWithoutResult(status -> campaignRepository.findById(campaignId).ifPresent(c -> {
            if (c.isCancelRequested()) {
                c.acknowledgeCancelled();
                campaignRepository.save(c);
                return;
            }
            long remaining = recipientRepository.countByCampaignIdAndStatus(campaignId, SmsRecipientStatus.PENDING);
            if (remaining == 0) {
                c.complete();
                campaignRepository.save(c);
            }
        }));
    }
}
