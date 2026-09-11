package np.com.lims.admin;

import np.com.lims.admin.dto.AdminDtos.AuditDetail;
import np.com.lims.admin.dto.AdminDtos.AuditListItem;
import np.com.lims.admin.dto.AdminDtos.CreateUserRequest;
import np.com.lims.admin.dto.AdminDtos.ResetPasswordRequest;
import np.com.lims.admin.dto.AdminDtos.RoleResponse;
import np.com.lims.admin.dto.AdminDtos.UpdateUserRequest;
import np.com.lims.admin.dto.AdminDtos.UserDetail;
import np.com.lims.admin.dto.AdminDtos.UserListItem;
import np.com.lims.common.audit.AuditLogRepository;
import np.com.lims.common.audit.AuditService;
import np.com.lims.common.exception.ApiException;
import np.com.lims.common.exception.ErrorCode;
import np.com.lims.common.web.CurrentUser;
import np.com.lims.rbac.entity.Role;
import np.com.lims.rbac.entity.RoleName;
import np.com.lims.rbac.repository.RoleRepository;
import np.com.lims.user.entity.User;
import np.com.lims.user.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AdminService {

    private static final String MODULE = "ADMIN";
    private static final int EXPORT_LIMIT = 10_000;

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final np.com.lims.branch.BranchRepository branchRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    public AdminService(AuditLogRepository auditLogRepository,
                        UserRepository userRepository,
                        RoleRepository roleRepository,
                        np.com.lims.branch.BranchRepository branchRepository,
                        PasswordEncoder passwordEncoder,
                        AuditService auditService) {
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.branchRepository = branchRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
    }

    // ===== audit ================================================

    @Transactional(readOnly = true)
    public Page<AuditListItem> searchAudit(String module, String actor, String entityType, String entityId,
                                           Instant from, Instant to, String search, Pageable pageable) {
        return auditLogRepository.search(
                trimToNull(module), trimToNull(actor), trimToNull(entityType), trimToNull(entityId),
                from, to, trimToNull(search), pageable).map(AuditListItem::from);
    }

    /**
     * Every audit entry matching the current filters (up to {@link #EXPORT_LIMIT}), for CSV/XML
     * export — the web layer's {@code spring.data.web.pageable.max-page-size} (100) would
     * otherwise silently truncate a naive "just ask for a huge page size" export to 100 rows.
     * Not truly unbounded: a fully unpaged sort over this table can exhaust MySQL's sort buffer
     * on a large audit log (hit live during testing) — narrow the filters if a report needs more
     * than {@link #EXPORT_LIMIT} rows.
     */
    @Transactional(readOnly = true)
    public java.util.List<AuditListItem> exportAudit(String module, String actor, String entityType, String entityId,
                                                      Instant from, Instant to, String search) {
        // The underlying query already hardcodes ORDER BY createdAt DESC — adding a Sort here
        // duplicated that clause (visible in the failing query's SQL log: "...desc,...desc").
        org.springframework.data.domain.Pageable page =
                org.springframework.data.domain.PageRequest.of(0, EXPORT_LIMIT);
        return auditLogRepository.search(
                trimToNull(module), trimToNull(actor), trimToNull(entityType), trimToNull(entityId),
                from, to, trimToNull(search), page)
                .map(AuditListItem::from).getContent();
    }

    @Transactional(readOnly = true)
    public AuditDetail auditDetail(Long id) {
        return auditLogRepository.findById(id).map(AuditDetail::from)
                .orElseThrow(() -> ApiException.notFound("Audit entry", id));
    }

    @Transactional(readOnly = true)
    public List<String> auditModules() {
        return auditLogRepository.distinctModules();
    }

    // ===== roles ===============================================

    @Transactional(readOnly = true)
    public List<RoleResponse> roles() {
        return roleRepository.findAllByOrderByNameAsc().stream().map(RoleResponse::from).toList();
    }

    // ===== users ==============================================

    @Transactional(readOnly = true)
    public Page<UserListItem> searchUsers(String query, boolean enabledOnly, Pageable pageable) {
        return userRepository.search(trimToNull(query), enabledOnly, pageable).map(UserListItem::from);
    }

    @Transactional(readOnly = true)
    public UserDetail getUser(Long id) {
        return UserDetail.from(loadUser(id));
    }

    @Transactional
    public UserDetail createUser(CreateUserRequest request) {
        String username = request.username().trim();
        if (userRepository.existsByUsernameIgnoreCase(username)) {
            throw ApiException.conflict("Username " + username + " is already taken");
        }
        if (userRepository.existsByEmailIgnoreCase(request.email().trim())) {
            throw ApiException.conflict("Email " + request.email() + " is already in use");
        }
        User user = User.create(username, request.email().trim().toLowerCase(),
                passwordEncoder.encode(request.password()), request.fullName().trim(),
                trimToNull(request.phone()));
        resolveRoles(request.roleNames()).forEach(user::addRole);
        user.setHomeBranch(resolveBranch(request.homeBranchId()));
        User saved = userRepository.save(user);
        auditService.record(MODULE, "USER_CREATE", "User", saved.getId(),
                "Created user " + username + " with roles " + request.roleNames(), null, UserDetail.from(saved));
        return UserDetail.from(saved);
    }

    @Transactional
    public UserDetail updateUser(Long id, UpdateUserRequest request) {
        User user = loadUser(id);
        UserDetail before = UserDetail.from(user);
        user.updateProfile(request.fullName().trim(), request.email().trim().toLowerCase(),
                trimToNull(request.phone()));
        Set<Role> newRoles = resolveRoles(request.roleNames());
        user.getRoles().clear();
        newRoles.forEach(user::addRole);
        user.setHomeBranch(resolveBranch(request.homeBranchId()));
        auditService.record(MODULE, "USER_UPDATE", "User", id,
                "Updated user " + user.getUsername(), before, UserDetail.from(user));
        return UserDetail.from(user);
    }

    @Transactional
    public UserDetail setUserEnabled(Long id, boolean enabled) {
        User user = loadUser(id);
        if (!enabled && user.getUsername().equalsIgnoreCase(CurrentUser.username())) {
            throw ApiException.conflict("You cannot deactivate your own account");
        }
        user.setEnabled(enabled);
        auditService.record(MODULE, enabled ? "USER_ENABLE" : "USER_DISABLE", "User", id,
                (enabled ? "Enabled" : "Disabled") + " user " + user.getUsername(), null, null);
        return UserDetail.from(user);
    }

    @Transactional
    public void resetPassword(Long id, ResetPasswordRequest request) {
        User user = loadUser(id);
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        auditService.record(MODULE, "USER_PASSWORD_RESET", "User", id,
                "Reset password for user " + user.getUsername(), null, null);
    }

    private Set<Role> resolveRoles(List<String> roleNames) {
        Set<RoleName> wanted = roleNames.stream().map(name -> {
            try {
                return RoleName.valueOf(name);
            } catch (IllegalArgumentException e) {
                throw new ApiException(ErrorCode.VALIDATION_FAILED, "Unknown role: " + name);
            }
        }).collect(Collectors.toSet());
        List<Role> found = roleRepository.findByNameIn(wanted);
        if (found.size() != wanted.size()) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "One or more roles were not recognised");
        }
        return Set.copyOf(found);
    }

    private User loadUser(Long id) {
        return userRepository.findWithRolesById(id).orElseThrow(() -> ApiException.notFound("User", id));
    }

    /** Null = the user gets access to every branch (HQ / roaming staff). */
    private np.com.lims.branch.entity.Branch resolveBranch(Long branchId) {
        if (branchId == null) {
            return null;
        }
        return branchRepository.findById(branchId).orElseThrow(() -> ApiException.notFound("Branch", branchId));
    }

    private static String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
