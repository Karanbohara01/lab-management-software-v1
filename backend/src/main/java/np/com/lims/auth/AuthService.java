package np.com.lims.auth;

import np.com.lims.auth.dto.CurrentUserResponse;
import np.com.lims.auth.dto.ForgotPasswordRequest;
import np.com.lims.auth.dto.LoginRequest;
import np.com.lims.auth.dto.ResetPasswordRequest;
import np.com.lims.auth.dto.TokenResponse;
import np.com.lims.auth.entity.PasswordResetToken;
import np.com.lims.common.audit.AuditService;
import np.com.lims.common.exception.ApiException;
import np.com.lims.common.exception.ErrorCode;
import np.com.lims.common.tenant.TenantContext;
import np.com.lims.messaging.gateway.EmailGateway;
import np.com.lims.security.JwtService;
import np.com.lims.security.TokenType;
import np.com.lims.user.entity.User;
import np.com.lims.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private static final String MODULE = "AUTH";
    private static final Duration RESET_TOKEN_TTL = Duration.ofHours(1);
    private static final SecureRandom RANDOM = new SecureRandom();

    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final LoginAttemptLimiter loginAttemptLimiter;
    private final PasswordResetTokenRepository resetTokenRepository;
    private final PasswordResetAttemptLimiter resetAttemptLimiter;
    private final EmailGateway emailGateway;
    private final AuditService auditService;
    private final String publicUrl;

    public AuthService(JwtService jwtService,
                       UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       LoginAttemptLimiter loginAttemptLimiter,
                       PasswordResetTokenRepository resetTokenRepository,
                       PasswordResetAttemptLimiter resetAttemptLimiter,
                       EmailGateway emailGateway,
                       AuditService auditService,
                       @Value("${lims.app.public-url}") String publicUrl) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.loginAttemptLimiter = loginAttemptLimiter;
        this.resetTokenRepository = resetTokenRepository;
        this.resetAttemptLimiter = resetAttemptLimiter;
        this.emailGateway = emailGateway;
        this.auditService = auditService;
        this.publicUrl = publicUrl;
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

    /**
     * Always succeeds from the caller's point of view, regardless of whether {@code email}
     * actually belongs to an account — the response must never let a caller distinguish "sent" vs
     * "no such account" (classic email-enumeration leak). Silently does nothing (no row created,
     * no email sent) when the address doesn't match an enabled user, or when
     * {@link PasswordResetAttemptLimiter} has already capped this address for the window.
     */
    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        if (!resetAttemptLimiter.tryAcquire(request.email())) {
            return;
        }
        User user = userRepository.findByEmailIgnoreCase(request.email()).orElse(null);
        if (user == null || !user.isEnabled()) {
            return;
        }

        String rawToken = generateRawToken();
        PasswordResetToken token = PasswordResetToken.issueFor(user, hash(rawToken), Instant.now().plus(RESET_TOKEN_TTL));
        resetTokenRepository.save(token);

        String link = trimTrailingSlash(publicUrl) + "/reset-password?token=" + rawToken;
        EmailGateway.Result result = emailGateway.send(user.getEmail(), "Reset your LabOS password",
                "We received a request to reset your LabOS password.\n\n"
                        + "Reset it here (expires in 1 hour): " + link + "\n\n"
                        + "If you didn't request this, you can safely ignore this email — your password won't change.");
        if (!result.isSent()) {
            // Not surfaced to the caller (would leak account existence) — but worth knowing about
            // operationally, e.g. SMTP misconfigured in production.
            log.warn("Password reset email to {} not sent: {} — {}", user.getEmail(), result.errorCode(), result.errorMessage());
        }

        withTenant(user.getOrganizationId(), () -> auditService.record(MODULE, "PASSWORD_RESET_REQUESTED", "User",
                user.getId(), "Password reset requested for " + user.getUsername(), null, null));
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetToken token = resetTokenRepository.findByTokenHash(hash(request.token()))
                .filter(t -> t.isUsable(Instant.now()))
                .orElseThrow(() -> new ApiException(ErrorCode.TOKEN_INVALID, "This reset link is invalid or has expired."));

        User user = token.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));

        Instant now = Instant.now();
        token.markUsed(now);
        // A user who requested more than one reset link (e.g. clicked "forgot password" twice)
        // shouldn't leave the earlier, still-unused links live after the first one is redeemed.
        resetTokenRepository.findByUserIdAndUsedAtIsNull(user.getId()).forEach(t -> t.markUsed(now));

        withTenant(user.getOrganizationId(), () -> auditService.record(MODULE, "PASSWORD_RESET_COMPLETED", "User",
                user.getId(), "Password reset completed for " + user.getUsername(), null, null));
    }

    /**
     * {@code AuditService} (like every tenant-owned write) stamps {@code organization_id} from
     * {@link TenantContext}, which is never set for these two unauthenticated endpoints — so it's
     * set explicitly here, scoped to just the audit call, then cleared. Same technique as
     * {@code IrdSubmissionService.autoRetrySweep}'s per-row tenant switch.
     */
    private void withTenant(Long organizationId, Runnable action) {
        TenantContext.set(organizationId);
        try {
            action.run();
        } finally {
            TenantContext.clear();
        }
    }

    private static String generateRawToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String hash(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(rawToken.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is required to be available on every JVM", ex);
        }
    }

    private static String trimTrailingSlash(String url) {
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
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
