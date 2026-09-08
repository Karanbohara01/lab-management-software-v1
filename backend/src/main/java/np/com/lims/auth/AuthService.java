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
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final LoginAttemptLimiter loginAttemptLimiter;

    public AuthService(AuthenticationManager authenticationManager,
                       JwtService jwtService,
                       UserRepository userRepository,
                       LoginAttemptLimiter loginAttemptLimiter) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.loginAttemptLimiter = loginAttemptLimiter;
    }

    @Transactional
    public TokenResponse login(LoginRequest request) {
        loginAttemptLimiter.assertNotLocked(request.username());
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.username(), request.password()));
        } catch (BadCredentialsException ex) {
            loginAttemptLimiter.recordFailure(request.username());
            throw new ApiException(ErrorCode.INVALID_CREDENTIALS, "Invalid username or password");
        }

        User user = userRepository.findByUsernameIgnoreCase(request.username())
                .orElseThrow(() -> new ApiException(ErrorCode.INVALID_CREDENTIALS, "Invalid username or password"));
        loginAttemptLimiter.recordSuccess(request.username());
        user.recordLogin(Instant.now());

        return issueTokens(user);
    }

    @Transactional(readOnly = true)
    public TokenResponse refresh(String refreshToken) {
        String username = jwtService.parseSubject(refreshToken, TokenType.REFRESH);
        User user = userRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new ApiException(ErrorCode.TOKEN_INVALID, "Token is invalid"));
        if (!user.isEnabled()) {
            throw new ApiException(ErrorCode.ACCESS_DENIED, "Account is disabled");
        }
        return issueTokens(user);
    }

    @Transactional(readOnly = true)
    public CurrentUserResponse currentUser(String username) {
        return userRepository.findByUsernameIgnoreCase(username)
                .map(CurrentUserResponse::from)
                .orElseThrow(() -> new ApiException(ErrorCode.AUTHENTICATION_REQUIRED, "Session is no longer valid"));
    }

    private TokenResponse issueTokens(User user) {
        String access = jwtService.issueAccessToken(user.getUsername());
        String refresh = jwtService.issueRefreshToken(user.getUsername());
        return TokenResponse.bearer(access, refresh, jwtService.accessTokenTtlSeconds(),
                CurrentUserResponse.from(user));
    }
}
