package np.com.lims.auth;

import np.com.lims.common.exception.ApiException;
import np.com.lims.common.exception.ErrorCode;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory throttle for failed logins, keyed by username. After {@link #MAX_FAILURES} failures the
 * account is refused for {@link #LOCK_DURATION}. Deliberately simple (single-node); a clustered
 * deployment should move this to a shared store.
 */
@Component
public class LoginAttemptLimiter {

    private static final int MAX_FAILURES = 5;
    private static final Duration LOCK_DURATION = Duration.ofMinutes(15);

    private record Attempt(int failures, Instant lockedUntil) {}

    private final Map<String, Attempt> attempts = new ConcurrentHashMap<>();

    public void assertNotLocked(String username) {
        Attempt attempt = attempts.get(key(username));
        if (attempt != null && attempt.lockedUntil() != null && attempt.lockedUntil().isAfter(Instant.now())) {
            long minutes = Math.max(1, Duration.between(Instant.now(), attempt.lockedUntil()).toMinutes());
            throw new ApiException(ErrorCode.INVALID_CREDENTIALS,
                    "Too many failed attempts. Try again in about " + minutes + " minute(s).");
        }
    }

    public void recordFailure(String username) {
        attempts.compute(key(username), (k, current) -> {
            int failures = (current == null ? 0 : current.failures()) + 1;
            Instant lockedUntil = failures >= MAX_FAILURES ? Instant.now().plus(LOCK_DURATION) : null;
            return new Attempt(failures, lockedUntil);
        });
    }

    public void recordSuccess(String username) {
        attempts.remove(key(username));
    }

    private static String key(String username) {
        return username == null ? "" : username.trim().toLowerCase();
    }
}
