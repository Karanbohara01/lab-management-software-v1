package np.com.lims.user.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import np.com.lims.branch.entity.Branch;
import np.com.lims.common.audit.BaseEntity;
import np.com.lims.common.tenant.TenantContext;
import np.com.lims.doctor.entity.Doctor;
import np.com.lims.rbac.entity.Role;
import org.hibernate.annotations.Filter;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

/** Which clinic (tenant) this user belongs to — see {@link TenantContext} and {@link Filter}. */
@Entity
@Table(name = "app_user")
@Filter(name = "tenantFilter", condition = "organization_id = :tenantId")
public class User extends BaseEntity {

    /** Auto-stamped from {@link TenantContext} on create — never set directly by application code. */
    @Column(name = "organization_id", nullable = false, updatable = false)
    private Long organizationId;

    @Column(name = "username", nullable = false, unique = true, length = 64)
    private String username;

    @Column(name = "email", nullable = false, unique = true, length = 160)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 100)
    private String passwordHash;

    @Column(name = "full_name", nullable = false, length = 160)
    private String fullName;

    @Column(name = "phone", length = 32)
    private String phone;

    @Column(name = "enabled", nullable = false)
    private boolean enabled = true;

    @Column(name = "last_login_at")
    private Instant lastLoginAt;

    /** Null = access to all branches (HQ / roaming); set = restricted to this branch's data. */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "home_branch_id")
    private Branch homeBranch;

    /**
     * Null for every staff account. Set only for a DOCTOR-role login belonging to a specific
     * referring physician — see {@link np.com.lims.common.web.CurrentUser#doctorId()}: every
     * order/report query for such a user must be scoped to this doctor's own referrals, the same
     * way {@link #homeBranch} scopes a branch-restricted staff account.
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "doctor_id")
    private Doctor doctor;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "user_role",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private Set<Role> roles = new HashSet<>();

    protected User() {
    }

    public static User create(String username, String email, String passwordHash, String fullName, String phone) {
        User u = new User();
        u.username = username;
        u.email = email;
        u.passwordHash = passwordHash;
        u.fullName = fullName;
        u.phone = phone;
        u.enabled = true;
        return u;
    }

    /**
     * Same as {@link #create}, but for a platform admin creating a clinic's very first user on
     * its behalf — {@code organizationId} is set explicitly rather than left to the usual
     * {@code TenantContext}-based {@code @PrePersist} stamp, since the platform admin's own
     * tenant context is a different (or no) organization.
     */
    public static User createForOrganization(Long organizationId, String username, String email,
                                              String passwordHash, String fullName, String phone) {
        User u = create(username, email, passwordHash, fullName, phone);
        u.organizationId = organizationId;
        return u;
    }

    @PrePersist
    private void assignTenant() {
        if (organizationId == null) {
            organizationId = TenantContext.require();
        }
    }

    public Long getOrganizationId() {
        return organizationId;
    }

    public void addRole(Role role) {
        this.roles.add(role);
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public void updateProfile(String fullName, String email, String phone) {
        this.fullName = fullName;
        this.email = email;
        this.phone = phone;
    }

    public void setHomeBranch(Branch homeBranch) {
        this.homeBranch = homeBranch;
    }

    public Branch getHomeBranch() {
        return homeBranch;
    }

    public void setDoctor(Doctor doctor) {
        this.doctor = doctor;
    }

    public Doctor getDoctor() {
        return doctor;
    }

    public String getUsername() {
        return username;
    }

    public String getEmail() {
        return email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public String getFullName() {
        return fullName;
    }

    public String getPhone() {
        return phone;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public Instant getLastLoginAt() {
        return lastLoginAt;
    }

    public Set<Role> getRoles() {
        return roles;
    }

    public void recordLogin(Instant when) {
        this.lastLoginAt = when;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }
}
