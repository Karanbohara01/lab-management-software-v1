package np.com.lims.communication;

import np.com.lims.common.tenant.TenantContext;
import np.com.lims.communication.gateway.BalanceCheckableGateway;
import np.com.lims.communication.gateway.SmsGatewayRegistry;
import np.com.lims.messaging.SmsCredentialsRepository;
import np.com.lims.messaging.entity.SmsCredentials;
import np.com.lims.notification.NotificationService;
import np.com.lims.notification.entity.Notification;
import np.com.lims.platform.OrganizationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

/**
 * Once a day, checks each organization's own configured low-balance threshold (opt-in — see
 * {@code SmsCredentials#lowBalanceThreshold}, null by default, the same "nobody gets paged until
 * they ask" convention every other automated notification in this feature follows) against its
 * actual SMS provider balance, and raises a {@link Notification} if it's crossed.
 *
 * <p>Never alerts off an unconfirmed or unavailable balance: {@code BalanceCheckableGateway}'s own
 * javadoc explains Samaya's balance field is a best-effort parse of an undocumented response shape,
 * and {@code SparrowSmsGateway} doesn't implement balance-checking at all — in both cases this sweep
 * simply has nothing to say, and silence is the honest choice, not a fabricated warning.
 *
 * <p>Same org-loop + explicit {@link TenantContext} + {@code @Lazy} self-proxy + per-org
 * {@code REQUIRES_NEW} transaction shape as {@code NotificationSweeper} — see that class's own
 * javadoc for why a single shared transaction across every organization was tried first and found
 * broken live (one organization's failure silently discarding every other organization's work).
 */
@Component
public class SmsBalanceSweep {

    private static final Logger log = LoggerFactory.getLogger(SmsBalanceSweep.class);

    private final OrganizationRepository organizationRepository;
    private final SmsCredentialsRepository credentialsRepository;
    private final SmsGatewayRegistry gatewayRegistry;
    private final NotificationService notificationService;
    private final SmsBalanceSweep self;

    public SmsBalanceSweep(OrganizationRepository organizationRepository, SmsCredentialsRepository credentialsRepository,
                           SmsGatewayRegistry gatewayRegistry, NotificationService notificationService,
                           @Lazy SmsBalanceSweep self) {
        this.organizationRepository = organizationRepository;
        this.credentialsRepository = credentialsRepository;
        this.gatewayRegistry = gatewayRegistry;
        this.notificationService = notificationService;
        this.self = self;
    }

    @Scheduled(cron = "${lims.sms.balance-sweep-cron:0 0 8 * * *}")
    public void sweep() {
        log.debug("Running SMS low-balance sweep");
        for (Long orgId : organizationRepository.findActiveIds()) {
            TenantContext.set(orgId);
            try {
                self.sweepOrg(orgId);
            } catch (RuntimeException ex) {
                log.warn("SMS balance sweep failed for organization {}: {}", orgId, ex.toString());
            } finally {
                TenantContext.clear();
            }
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void sweepOrg(Long orgId) {
        SmsCredentials creds = credentialsRepository.findByOrganizationId(orgId).orElse(null);
        if (creds == null || creds.getLowBalanceThreshold() == null) {
            return;
        }
        SmsGatewayRegistry.ResolvedGateway resolved = gatewayRegistry.effective();
        if (!(resolved.gateway() instanceof BalanceCheckableGateway balanceCheckable)) {
            return;
        }
        var result = balanceCheckable.checkBalance();
        if (!result.available() || result.balance() == null || result.balance() >= creds.getLowBalanceThreshold()) {
            return;
        }
        notificationService.publish(Notification.Type.SMS_LOW_BALANCE, Notification.Severity.WARNING,
                "Low SMS balance",
                resolved.gateway().provider() + " balance is " + result.balance()
                        + " — below your alert threshold of " + creds.getLowBalanceThreshold() + ".",
                "/app/communication/config", "COMMUNICATION_CONFIG_MANAGE",
                "sms-balance:" + LocalDate.now());
    }
}
