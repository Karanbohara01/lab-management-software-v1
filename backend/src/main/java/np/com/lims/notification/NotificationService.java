package np.com.lims.notification;

import np.com.lims.common.exception.ApiException;
import np.com.lims.notification.entity.Notification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Set;

@Service
public class NotificationService {

    private static final int LOOKBACK_DAYS = 30;

    private final NotificationRepository repository;

    public NotificationService(NotificationRepository repository) {
        this.repository = repository;
    }

    public record NotificationDto(Long id, String type, String severity, String title, String message,
                                  String linkPath, boolean read, Instant createdAt) {
        static NotificationDto from(Notification n, String username) {
            return new NotificationDto(n.getId(), n.getType().name(), n.getSeverity().name(), n.getTitle(),
                    n.getMessage(), n.getLinkPath(), n.isReadBy(username), n.getCreatedAt());
        }
    }

    /**
     * Records an operational notification. If a {@code reference} is given, a matching notification of the
     * same type raised in the last 24h suppresses the new one (so sweeps don't spam).
     */
    @Transactional
    public void publish(Notification.Type type, Notification.Severity severity, String title, String message,
                        String linkPath, String targetPermission, String reference) {
        if (reference != null
                && repository.existsByTypeAndReferenceAndCreatedAtAfter(type, reference, Instant.now().minus(1, ChronoUnit.DAYS))) {
            return;
        }
        repository.save(new Notification(type, severity, title, message, linkPath, targetPermission, reference));
    }

    @Transactional(readOnly = true)
    public List<NotificationDto> list(String username, Set<String> permissions, boolean unreadOnly, int limit) {
        return repository.recent(Instant.now().minus(LOOKBACK_DAYS, ChronoUnit.DAYS)).stream()
                .filter(n -> n.visibleTo(permissions))
                .filter(n -> !unreadOnly || !n.isReadBy(username))
                .limit(limit)
                .map(n -> NotificationDto.from(n, username))
                .toList();
    }

    @Transactional(readOnly = true)
    public long unreadCount(String username, Set<String> permissions) {
        return repository.recent(Instant.now().minus(LOOKBACK_DAYS, ChronoUnit.DAYS)).stream()
                .filter(n -> n.visibleTo(permissions))
                .filter(n -> !n.isReadBy(username))
                .count();
    }

    @Transactional
    public void markRead(Long id, String username) {
        Notification notification = repository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Notification", id));
        notification.markReadBy(username);
    }

    @Transactional
    public void markAllRead(String username, Set<String> permissions) {
        repository.recent(Instant.now().minus(LOOKBACK_DAYS, ChronoUnit.DAYS)).stream()
                .filter(n -> n.visibleTo(permissions))
                .forEach(n -> n.markReadBy(username));
    }
}
