package np.com.lims.auth.dto;

import np.com.lims.user.entity.User;

import java.util.List;
import java.util.Set;
import java.util.TreeSet;

public record CurrentUserResponse(
        Long id,
        String username,
        String email,
        String fullName,
        List<String> roles,
        List<String> permissions,
        /** Null = access to every branch (HQ / roaming staff). */
        Long homeBranchId,
        String homeBranchName
) {
    public static CurrentUserResponse from(User user) {
        Set<String> roles = new TreeSet<>();
        Set<String> permissions = new TreeSet<>();
        user.getRoles().forEach(role -> {
            roles.add(role.getName().name());
            role.getPermissions().forEach(p -> permissions.add(p.getName().name()));
        });
        return new CurrentUserResponse(
                user.getId(), user.getUsername(), user.getEmail(), user.getFullName(),
                List.copyOf(roles), List.copyOf(permissions),
                user.getHomeBranch() == null ? null : user.getHomeBranch().getId(),
                user.getHomeBranch() == null ? null : user.getHomeBranch().getName());
    }
}
