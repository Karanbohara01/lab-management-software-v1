package np.com.lims.notification;

import np.com.lims.common.tenant.TenantContext;
import np.com.lims.inventory.InventoryItemService;
import np.com.lims.inventory.dto.InventoryDtos.ItemListItem;
import np.com.lims.notification.entity.Notification;
import np.com.lims.platform.OrganizationRepository;
import np.com.lims.result.TestResultRepository;
import np.com.lims.result.entity.ResultStatus;
import np.com.lims.result.entity.TestResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Periodically raises notifications for standing conditions (low/expiring stock, verification
 * backlog, breached turnaround time) that no single user action would surface. Dedup in
 * {@link NotificationService#publish} keeps re-runs quiet.
 *
 * <h2>Runs across every organization — TenantContext set explicitly per one</h2>
 * There's no HTTP request here to resolve a tenant from (same situation as
 * {@code IrdSubmissionService#autoRetrySweep}), so each sweep method below is called once per
 * active organization with {@link TenantContext} set for its duration. This is a correctness fix,
 * not just style: without it, every read here runs with the Hibernate tenant filter disabled (so
 * "results awaiting verification" would silently count every organization's backlog as one number)
 * and every {@code notificationService.publish(...)} call would throw {@code IllegalStateException}
 * the moment {@link Notification}'s {@code @PrePersist} hit {@code TenantContext.require()} with
 * nothing set — meaning, before this fix, the sweep never actually wrote a single notification row
 * once more than one organization existed; it only ever looked like it worked.
 */
@Component
public class NotificationSweeper {

    private static final Logger log = LoggerFactory.getLogger(NotificationSweeper.class);
    private static final long BACKLOG_ALERT_THRESHOLD = 10;

    private final NotificationService notificationService;
    private final InventoryItemService inventoryItemService;
    private final TestResultRepository resultRepository;
    private final OrganizationRepository organizationRepository;
    private final NotificationSweeper self;

    public NotificationSweeper(NotificationService notificationService,
                               InventoryItemService inventoryItemService,
                               TestResultRepository resultRepository,
                               OrganizationRepository organizationRepository,
                               @Lazy NotificationSweeper self) {
        this.notificationService = notificationService;
        this.inventoryItemService = inventoryItemService;
        this.resultRepository = resultRepository;
        this.organizationRepository = organizationRepository;
        this.self = self;
    }

    @Scheduled(cron = "${lims.notifications.sweep-cron:0 0 */2 * * *}")
    public void sweep() {
        log.debug("Running notification sweep");
        for (Long orgId : organizationRepository.findActiveIds()) {
            TenantContext.set(orgId);
            try {
                // Called through the injected proxy (`self`), not directly, and in its OWN fresh
                // transaction (REQUIRES_NEW) — deliberately, not REQUIRED (the default). One shared
                // transaction across every organization was tried first and found broken live: any
                // RuntimeException escaping a nested @Transactional call (notificationService.publish
                // is itself @Transactional) marks the WHOLE physical transaction rollback-only, even
                // once the exception is caught here — so one organization's failure (confirmed live:
                // an organization with no laboratory profile yet throws from sweepInventory) silently
                // discarded every OTHER organization's notifications too, via UnexpectedRollbackException
                // at commit. REQUIRES_NEW gives each organization its own independent transaction, so
                // a failure in one can never touch another's.
                self.sweepOrg(orgId);
            } catch (RuntimeException ex) {
                log.warn("Notification sweep failed for organization {}: {}", orgId, ex.toString());
            } finally {
                TenantContext.clear();
            }
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void sweepOrg(Long orgId) {
        sweepInventory(orgId);
        sweepResultBacklog(orgId);
        sweepTatBreaches(orgId);
    }

    private void sweepInventory(Long orgId) {
        for (ItemListItem item : inventoryItemService.summaryForOrg(orgId).alerts()) {
            Notification.Type type = switch (item.status()) {
                case EXPIRED -> Notification.Type.EXPIRED_STOCK;
                case EXPIRING_SOON -> Notification.Type.EXPIRING_STOCK;
                default -> Notification.Type.LOW_STOCK;
            };
            Notification.Severity severity = item.status() == np.com.lims.inventory.entity.StockStatus.EXPIRED
                    ? Notification.Severity.CRITICAL : Notification.Severity.WARNING;
            notificationService.publish(type, severity,
                    switch (item.status()) {
                        case EXPIRED -> "Expired stock: " + item.name();
                        case EXPIRING_SOON -> "Stock expiring soon: " + item.name();
                        case OUT_OF_STOCK -> "Out of stock: " + item.name();
                        default -> "Low stock: " + item.name();
                    },
                    item.code() + " — " + item.quantityOnHand() + " " + item.unit() + " on hand",
                    "/inventory/" + item.id(), "INVENTORY_READ",
                    "inventory:" + item.id() + ":" + item.status());
        }
    }

    private void sweepResultBacklog(Long orgId) {
        long pending = resultRepository.countByStatusAndOrganizationId(ResultStatus.ENTERED, orgId);
        if (pending >= BACKLOG_ALERT_THRESHOLD) {
            notificationService.publish(Notification.Type.RESULT_BACKLOG, Notification.Severity.WARNING,
                    "Results awaiting verification",
                    pending + " results are entered and waiting to be verified",
                    "/results", "RESULT_VERIFY",
                    "backlog:" + java.time.LocalDate.now());
        }
    }

    /**
     * Push alerting for TAT breaches (dashboard visibility already existed via
     * {@code TestResultRepository#countOverdue}/{@code overdueOnly} — this is the missing
     * proactive half). One notification per still-breached result, re-raised daily via the date in
     * its dedup key (not just once ever) so a result stuck for days keeps surfacing, not just on
     * the day it first crossed its due time. Routed to whichever role's queue the result is
     * actually sitting in (RESULT_VERIFY for an ENTERED result awaiting verification, RESULT_APPROVE
     * for a VERIFIED one awaiting approval) rather than a single generic audience.
     */
    private void sweepTatBreaches(Long orgId) {
        for (TestResult r : resultRepository.findOverdueUnresolved(orgId)) {
            String targetPermission = switch (r.getStatus()) {
                case VERIFIED -> "RESULT_APPROVE";
                case ENTERED -> "RESULT_VERIFY";
                default -> "RESULT_ENTER";
            };
            notificationService.publish(Notification.Type.TAT_BREACH, Notification.Severity.WARNING,
                    "TAT breached: " + r.getTestName(),
                    r.getPatient().getFullName() + " (" + r.getPatient().getMrn() + ") — "
                            + r.getTestCode() + " was due " + r.getDueAt() + ", still " + r.getStatus(),
                    "/results/" + r.getId(), targetPermission,
                    "tat:" + r.getId() + ":" + java.time.LocalDate.now());
        }
    }
}
