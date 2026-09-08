package np.com.lims.admin.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import np.com.lims.common.audit.AuditLog;
import np.com.lims.rbac.entity.Permission;
import np.com.lims.rbac.entity.Role;
import np.com.lims.user.entity.User;

import java.time.Instant;
import java.util.List;

public final class AdminDtos {

    private AdminDtos() {
    }

    // ===== audit =================================================

    public record AuditListItem(Long id, String actor, String action, String module, String entityType,
                                String entityId, String summary, String ipAddress, Instant createdAt) {
        public static AuditListItem from(AuditLog a) {
            return new AuditListItem(a.getId(), a.getActor(), a.getAction(), a.getModule(), a.getEntityType(),
                    a.getEntityId(), a.getSummary(), a.getIpAddress(), a.getCreatedAt());
        }
    }

    public record AuditDetail(Long id, String actor, String action, String module, String entityType,
                              String entityId, String summary, String ipAddress, Instant createdAt,
                              String beforeState, String afterState) {
        public static AuditDetail from(AuditLog a) {
            return new AuditDetail(a.getId(), a.getActor(), a.getAction(), a.getModule(), a.getEntityType(),
                    a.getEntityId(), a.getSummary(), a.getIpAddress(), a.getCreatedAt(),
                    a.getBeforeState(), a.getAfterState());
        }
    }

    // ===== roles ================================================

    public record RoleResponse(Long id, String name, String description, List<String> permissions) {
        public static RoleResponse from(Role r) {
            return new RoleResponse(r.getId(), r.getName().name(), r.getDescription(),
                    r.getPermissions().stream().map(Permission::getName).map(Enum::name).sorted().toList());
        }
    }

    // ===== users ===============================================

    public record CreateUserRequest(
            @NotBlank @Size(min = 3, max = 64) String username,
            @NotBlank @Email @Size(max = 160) String email,
            @NotBlank @Size(max = 160) String fullName,
            @Size(max = 32) String phone,
            @NotEmpty List<String> roleNames,
            @NotBlank @Size(min = 8, max = 100) String password
    ) {
    }

    public record UpdateUserRequest(
            @NotBlank @Email @Size(max = 160) String email,
            @NotBlank @Size(max = 160) String fullName,
            @Size(max = 32) String phone,
            @NotEmpty List<String> roleNames
    ) {
    }

    public record ResetPasswordRequest(@NotBlank @Size(min = 8, max = 100) String newPassword) {
    }

    public record UserListItem(Long id, String username, String fullName, String email, List<String> roles,
                               boolean enabled, Instant lastLoginAt) {
        public static UserListItem from(User u) {
            return new UserListItem(u.getId(), u.getUsername(), u.getFullName(), u.getEmail(),
                    u.getRoles().stream().map(r -> r.getName().name()).sorted().toList(),
                    u.isEnabled(), u.getLastLoginAt());
        }
    }

    public record UserDetail(Long id, String username, String fullName, String email, String phone,
                             List<String> roles, boolean enabled, Instant lastLoginAt, Instant createdAt) {
        public static UserDetail from(User u) {
            return new UserDetail(u.getId(), u.getUsername(), u.getFullName(), u.getEmail(), u.getPhone(),
                    u.getRoles().stream().map(r -> r.getName().name()).sorted().toList(),
                    u.isEnabled(), u.getLastLoginAt(), u.getCreatedAt());
        }
    }
}
