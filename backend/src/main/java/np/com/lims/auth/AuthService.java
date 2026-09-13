package np.com.lims.auth;

import np.com.lims.auth.dto.CurrentUserResponse;
import np.com.lims.auth.dto.LoginRequest;
import np.com.lims.auth.dto.TokenResponse;
import np.com.lims.common.exception.ApiException;
import np.com.lims.common.exception.ErrorCode;
import np.com.lims.security.JwtService;
import np.com.lims.security.TokenType;
import np.com.lims.user.entity.User;
import np.com.lims.user.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class AuthService {

    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final LoginAttemptLimiter loginAttemptLimiter;

    public AuthService(JwtService jwtService,
                       UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       LoginAttemptLimiter loginAttemptLimiter) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.loginAttemptLimiter = loginAttemptLimiter;
    }

    /**
     * Notes on two things that are easy to get wrong in a multi-tenant login:
     * <ol>
     *   <li><b>Suspension</b> — deliberately NOT checked here. A suspended clinic's admin must
     *       still be able to log in to pay their way back in. Enforced per-request instead, in
     *       {@code TenantFilterInterceptor}, which allows only {@code /auth/**} and
     *       {@code /billing/subscription/**} through while suspended; everything else gets a 402.
     *       See that class's javadoc for the full reasoning.</li>
     *   <li><b>Username collisions across clinics</b> — usernames are only unique WITHIN an
     *       organization ({@code UNIQUE (organization_id, username)}, by design: every clinic can
     *       have its own "admin"), so a plain "look up by username" is not safe here — two
     *       different clinics picking overlapping usernames (even differing only by case) is a
     *       real, expected scenario, not a data bug (confirmed live: a self-signed-up clinic's
     *       admin and an unrelated earlier test account both landed on "karan"/"Karan", and the
     *       naive {@code findByUsernameIgnoreCase} — a single-result query — started throwing
     *       {@code IncorrectResultSizeDataAccessException} on every login attempt for BOTH
     *       accounts, silently surfaced as a generic "Authentication failed" with no indication of
     *       the real cause). Fixed by fetching every candidate across all organizations and
     *       testing the submitted password against each one — the password itself is what
     *       disambiguates which specific account the person means, so no separate
     *       "which clinic" field is needed on the login form. {@link #issueTokens} then mints the
     *       JWT's subject as the user's numeric, globally-unique ID rather than their username, so
     *       this same ambiguity can never resurface on every subsequent authenticated request via
     *       {@code JwtAuthenticationFilter} — only this one login step ever needs to disambiguate.
     *   </li>
     * </ol>
     */
    @Transactional
    public TokenResponse login(LoginRequest request) {
        loginAttemptLimiter.assertNotLocked(request.username());

        List<User> candidates = userRepository.findAllByUsernameIgnoreCase(request.username());
        User user = candidates.stream()
                .filter(u -> u.isEnabled() && passwordEncoder.matches(request.password(), u.getPasswordHash()))
                .findFirst()
                .orElse(null);

        if (user == null) {
            loginAttemptLimiter.recordFailure(request.username());
            throw new ApiException(ErrorCode.INVALID_CREDENTIALS, "Invalid username or password");
        }

        loginAttemptLimiter.recordSuccess(request.username());
        user.recordLogin(Instant.now());

        return issueTokens(user);
    }

    @Transactional(readOnly = true)
    public TokenResponse refresh(String refreshToken) {
        Long userId = parseUserId(jwtService.parseSubject(refreshToken, TokenType.REFRESH));
        User user = userRepository.findWithRolesById(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.TOKEN_INVALID, "Token is invalid"));
        if (!user.isEnabled()) {
            throw new ApiException(ErrorCode.ACCESS_DENIED, "Account is disabled");
        }
        return issueTokens(user);
    }

    @Transactional(readOnly = true)
    public CurrentUserResponse currentUser(Long userId) {
        return userRepository.findWithRolesById(userId)
                .map(CurrentUserResponse::from)
                .orElseThrow(() -> new ApiException(ErrorCode.AUTHENTICATION_REQUIRED, "Session is no longer valid"));
    }

    private TokenResponse issueTokens(User user) {
        String subject = String.valueOf(user.getId());
        String access = jwtService.issueAccessToken(subject);
        String refresh = jwtService.issueRefreshToken(subject);
        return TokenResponse.bearer(access, refresh, jwtService.accessTokenTtlSeconds(),
                CurrentUserResponse.from(user));
    }

    private static Long parseUserId(String subject) {
        try {
            return Long.valueOf(subject);
        } catch (NumberFormatException ex) {
            throw new ApiException(ErrorCode.TOKEN_INVALID, "Token is invalid");
        }
    }
}
