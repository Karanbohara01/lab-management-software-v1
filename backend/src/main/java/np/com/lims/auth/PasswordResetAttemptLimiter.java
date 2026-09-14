package np.com.lims.auth;

import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory throttle for {@code POST /auth/forgot-password}, keyed by the submitted email —
 * separate from {@link LoginAttemptLimiter} because the failure mode here is different: every
 * request potentially sends a real email, so the risk is spam/cost abuse against one address
 * rather than credential guessing. Silently caps at {@link #MAX_REQUESTS} per {@link #WINDOW}
 * rather than throwing — the endpoint's response is identical either way (see
 * {@code AuthService.forgotPassword}'s javadoc on why it never reveals whether an account exists),
 * so a distinguishable "too many requests" error would itself leak information. Deliberately
 * simple (single-node); a clustered deployment should move this to a shared store.
 */
@Component
public class PasswordResetAttemptLimiter {

    private static final int MAX_REQUESTS = 3;
    private static final Duration WINDOW = Duration.ofMinutes(15);

    private record Window(int count, Instant resetAt) {}

    private final Map<String, Window> windows = new ConcurrentHashMap<>();

    /** True if another reset email may be sent for this address right now. */
    public boolean tryAcquire(String email) {
        String key = key(email);
        Instant now = Instant.now();
        Window[] result = new Window[1];
        windows.compute(key, (k, current) -> {
            if (current == null || current.resetAt().isBefore(now)) {
                result[0] = new Window(1, now.plus(WINDOW));
            } else {
                result[0] = new Window(current.count() + 1, current.resetAt());
            }
            return result[0];
        });
        return result[0].count() <= MAX_REQUESTS;
    }

    private static String key(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }
}
