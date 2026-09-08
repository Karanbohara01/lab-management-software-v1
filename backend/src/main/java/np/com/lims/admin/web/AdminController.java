package np.com.lims.admin.web;

import jakarta.validation.Valid;
import np.com.lims.admin.AdminService;
import np.com.lims.admin.dto.AdminDtos.AuditDetail;
import np.com.lims.admin.dto.AdminDtos.AuditListItem;
import np.com.lims.admin.dto.AdminDtos.CreateUserRequest;
import np.com.lims.admin.dto.AdminDtos.ResetPasswordRequest;
import np.com.lims.admin.dto.AdminDtos.RoleResponse;
import np.com.lims.admin.dto.AdminDtos.UpdateUserRequest;
import np.com.lims.admin.dto.AdminDtos.UserDetail;
import np.com.lims.admin.dto.AdminDtos.UserListItem;
import np.com.lims.common.api.PageResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping
public class AdminController {

    private final AdminService service;

    public AdminController(AdminService service) {
        this.service = service;
    }

    // ----- audit ---------------------------------------------------

    @GetMapping("/audit-logs")
    @PreAuthorize("hasAuthority('PERM_AUDIT_READ')")
    public PageResponse<AuditListItem> audit(
            @RequestParam(required = false) String module,
            @RequestParam(required = false) String actor,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) String entityId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(required = false) String query,
            @PageableDefault(size = 30) Pageable pageable) {
        return PageResponse.from(service.searchAudit(module, actor, entityType, entityId, from, to, query, pageable));
    }

    @GetMapping("/audit-logs/modules")
    @PreAuthorize("hasAuthority('PERM_AUDIT_READ')")
    public List<String> auditModules() {
        return service.auditModules();
    }

    @GetMapping("/audit-logs/{id}")
    @PreAuthorize("hasAuthority('PERM_AUDIT_READ')")
    public AuditDetail auditDetail(@PathVariable Long id) {
        return service.auditDetail(id);
    }

    // ----- roles --------------------------------------------------

    @GetMapping("/roles")
    @PreAuthorize("hasAuthority('PERM_ROLE_READ')")
    public List<RoleResponse> roles() {
        return service.roles();
    }

    // ----- users -------------------------------------------------

    @GetMapping("/users")
    @PreAuthorize("hasAuthority('PERM_USER_READ')")
    public PageResponse<UserListItem> users(
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "false") boolean enabledOnly,
            @PageableDefault(size = 20, sort = "username") Pageable pageable) {
        return PageResponse.from(service.searchUsers(query, enabledOnly, pageable));
    }

    @GetMapping("/users/{id}")
    @PreAuthorize("hasAuthority('PERM_USER_READ')")
    public UserDetail user(@PathVariable Long id) {
        return service.getUser(id);
    }

    @PostMapping("/users")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('PERM_USER_WRITE')")
    public UserDetail createUser(@Valid @RequestBody CreateUserRequest request) {
        return service.createUser(request);
    }

    @PutMapping("/users/{id}")
    @PreAuthorize("hasAuthority('PERM_USER_WRITE')")
    public UserDetail updateUser(@PathVariable Long id, @Valid @RequestBody UpdateUserRequest request) {
        return service.updateUser(id, request);
    }

    @PatchMapping("/users/{id}/enabled")
    @PreAuthorize("hasAuthority('PERM_USER_WRITE')")
    public UserDetail setEnabled(@PathVariable Long id, @RequestParam boolean value) {
        return service.setUserEnabled(id, value);
    }

    @PostMapping("/users/{id}/reset-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('PERM_USER_WRITE')")
    public void resetPassword(@PathVariable Long id, @Valid @RequestBody ResetPasswordRequest request) {
        service.resetPassword(id, request);
    }
}
