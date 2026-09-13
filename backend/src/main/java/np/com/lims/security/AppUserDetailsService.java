package np.com.lims.security;

import np.com.lims.user.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AppUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public AppUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Only used by {@code DaoAuthenticationProvider}, which Spring Security's own scaffolding
     * still expects a {@code UserDetailsService} to provide — actual login in this app goes
     * through {@code AuthService.login}'s manual multi-candidate lookup instead (see its javadoc
     * for why a single-result username lookup isn't safe in a multi-tenant system), so this
     * method is not on the real login path and is safe to leave ambiguity-prone.
     */
    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return userRepository.findByUsernameIgnoreCase(username)
                .map(AppUserDetails::new)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
    }

    /**
     * The real per-request path — {@code JwtAuthenticationFilter} resolves the caller by the JWT
     * subject, which is the user's numeric id (globally unique, unlike username), so this never
     * hits the cross-tenant username-collision ambiguity {@link #loadUserByUsername} can.
     */
    @Transactional(readOnly = true)
    public UserDetails loadUserById(Long id) {
        return userRepository.findWithRolesById(id)
                .map(AppUserDetails::new)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + id));
    }
}
