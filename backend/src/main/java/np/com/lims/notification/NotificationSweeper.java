package np.com.lims.notification;

import np.com.lims.inventory.InventoryItemService;
import np.com.lims.inventory.dto.InventoryDtos.ItemListItem;
import np.com.lims.notification.entity.Notification;
import np.com.lims.result.TestResultRepository;
import np.com.lims.result.entity.ResultStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Periodically raises notifications for standing conditions (low/expiring stock, verification
 * backlog) that no single user action would surface. Dedup in {@link NotificationService#publish}
 * keeps re-runs quiet.
 */
@Component
public class NotificationSweeper {

    private static final Logger log = LoggerFactory.getLogger(NotificationSweeper.class);
    private static final long BACKLOG_ALERT_THRESHOLD = 10;

    private final NotificationService notificationService;
    private final InventoryItemService inventoryItemService;
    private final TestResultRepository resultRepository;

    public NotificationSweeper(NotificationService notificationService,
                               InventoryItemService inventoryItemService,
                               TestResultRepository resultRepository) {
        this.notificationService = notificationService;
        this.inventoryItemService = inventoryItemService;
        this.resultRepository = resultRepository;
    }

    @Scheduled(cron = "${lims.notifications.sweep-cron:0 0 */2 * * *}")
    @Transactional
    public void sweep() {
        log.debug("Running notification sweep");
        sweepInventory();
        sweepResultBacklog();
    }

    private void sweepInventory() {
        for (ItemListItem item : inventoryItemService.summary().alerts()) {
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

    private void sweepResultBacklog() {
        long pending = resultRepository.countByStatus(ResultStatus.ENTERED);
        if (pending >= BACKLOG_ALERT_THRESHOLD) {
            notificationService.publish(Notification.Type.RESULT_BACKLOG, Notification.Severity.WARNING,
                    "Results awaiting verification",
                    pending + " results are entered and waiting to be verified",
                    "/results", "RESULT_VERIFY",
                    "backlog:" + java.time.LocalDate.now());
        }
    }
}
