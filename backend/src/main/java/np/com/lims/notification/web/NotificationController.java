package np.com.lims.notification.web;

import np.com.lims.notification.NotificationService;
import np.com.lims.notification.NotificationService.NotificationDto;
import np.com.lims.security.AppUserDetails;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/notifications")
public class NotificationController {

    private final NotificationService service;

    public NotificationController(NotificationService service) {
        this.service = service;
    }

    private static Set<String> permissionsOf(AppUserDetails user) {
        return user.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(a -> a.startsWith("PERM_"))
                .map(a -> a.substring("PERM_".length()))
                .collect(Collectors.toSet());
    }

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_NOTIFICATION_READ')")
    public List<NotificationDto> list(@AuthenticationPrincipal AppUserDetails user,
                                      @RequestParam(defaultValue = "false") boolean unreadOnly,
                                      @RequestParam(defaultValue = "50") int limit) {
        return service.list(user.getUsername(), permissionsOf(user), unreadOnly, Math.min(limit, 100));
    }

    @GetMapping("/unread-count")
    @PreAuthorize("hasAuthority('PERM_NOTIFICATION_READ')")
    public UnreadCount unreadCount(@AuthenticationPrincipal AppUserDetails user) {
        return new UnreadCount(service.unreadCount(user.getUsername(), permissionsOf(user)));
    }

    @PostMapping("/{id}/read")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('PERM_NOTIFICATION_READ')")
    public void markRead(@AuthenticationPrincipal AppUserDetails user, @PathVariable Long id) {
        service.markRead(id, user.getUsername());
    }

    @PostMapping("/read-all")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('PERM_NOTIFICATION_READ')")
    public void markAllRead(@AuthenticationPrincipal AppUserDetails user) {
        service.markAllRead(user.getUsername(), permissionsOf(user));
    }

    public record UnreadCount(long count) {
    }
}
