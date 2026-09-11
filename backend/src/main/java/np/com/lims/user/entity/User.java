package np.com.lims.user.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import np.com.lims.branch.entity.Branch;
import np.com.lims.common.audit.BaseEntity;
import np.com.lims.rbac.entity.Role;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "app_user")
public class User extends BaseEntity {

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
