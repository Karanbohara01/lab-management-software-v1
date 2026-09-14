package np.com.lims.auth.entity;

import np.com.lims.user.entity.User;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Regression coverage for {@link PasswordResetToken#isUsable}, the guard
 * {@code AuthService.resetPassword} relies on to reject an expired or already-redeemed link.
 */
class PasswordResetTokenTest {

    private User user() {
        return User.createForOrganization(1L, "jdoe", "jdoe@example.com", "hash", "Jane Doe", null);
    }

    @Test
    void freshTokenIsUsable() {
        PasswordResetToken token = PasswordResetToken.issueFor(user(), "hash", Instant.now().plus(Duration.ofHours(1)));
        assertThat(token.isUsable(Instant.now())).isTrue();
    }

    @Test
    void expiredTokenIsNotUsable() {
        PasswordResetToken token = PasswordResetToken.issueFor(user(), "hash", Instant.now().minus(Duration.ofMinutes(1)));
        assertThat(token.isUsable(Instant.now())).isFalse();
    }

    @Test
    void usedTokenIsNotUsableEvenBeforeExpiry() {
        PasswordResetToken token = PasswordResetToken.issueFor(user(), "hash", Instant.now().plus(Duration.ofHours(1)));
        token.markUsed(Instant.now());
        assertThat(token.isUsable(Instant.now())).isFalse();
    }

    @Test
    void carriesTheUsersOrganizationId() {
        PasswordResetToken token = PasswordResetToken.issueFor(user(), "hash", Instant.now().plus(Duration.ofHours(1)));
        assertThat(token.getOrganizationId()).isEqualTo(1L);
    }
}
