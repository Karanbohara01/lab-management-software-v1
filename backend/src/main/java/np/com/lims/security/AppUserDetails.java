package np.com.lims.security;

import np.com.lims.user.entity.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/** Spring Security principal backed by a persistent {@link User}. */
public class AppUserDetails implements UserDetails {

    private final Long userId;
    private final String username;
    private final String passwordHash;
    private final boolean enabled;
    private final Set<GrantedAuthority> authorities;

    public AppUserDetails(User user) {
        this.userId = user.getId();
        this.username = user.getUsername();
        this.passwordHash = user.getPasswordHash();
        this.enabled = user.isEnabled();
        this.authorities = Stream.concat(
                user.getRoles().stream().map(r -> r.getName().authority()),
                user.getRoles().stream()
                        .flatMap(r -> r.getPermissions().stream())
                        .map(p -> p.getName().authority())
        ).distinct().map(SimpleGrantedAuthority::new).collect(Collectors.toUnmodifiableSet());
    }

    public Long getUserId() {
        return userId;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }
}
