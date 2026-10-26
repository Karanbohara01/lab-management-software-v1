package np.com.lims.notification;

import np.com.lims.notification.entity.Notification;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class NotificationServiceTest {

    @Test
    void prependsAppPrefixToBareLinkPaths() {
        Notification n = new Notification(Notification.Type.TAT_BREACH, Notification.Severity.WARNING,
                "TAT breached: CBC", "details", "/results/42", "RESULT_VERIFY", "tat:42:2026-10-25");

        NotificationService.NotificationDto dto = NotificationService.NotificationDto.from(n, "alice");

        assertThat(dto.linkPath()).isEqualTo("/app/results/42");
    }

    @Test
    void leavesAlreadyPrefixedLinkPathsUnchanged() {
        Notification n = new Notification(Notification.Type.SYSTEM, Notification.Severity.INFO,
                "title", null, "/app/results/42", null, null);

        NotificationService.NotificationDto dto = NotificationService.NotificationDto.from(n, "alice");

        assertThat(dto.linkPath()).isEqualTo("/app/results/42");
    }

    @Test
    void leavesNullOrBlankLinkPathUnchanged() {
        Notification withNull = new Notification(Notification.Type.SYSTEM, Notification.Severity.INFO,
                "title", null, null, null, null);
        Notification withBlank = new Notification(Notification.Type.SYSTEM, Notification.Severity.INFO,
                "title", null, "", null, null);

        assertThat(NotificationService.NotificationDto.from(withNull, "alice").linkPath()).isNull();
        assertThat(NotificationService.NotificationDto.from(withBlank, "alice").linkPath()).isEmpty();
    }
}
