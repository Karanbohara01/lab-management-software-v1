package np.com.lims.auth;

import np.com.lims.auth.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    /**
     * NOT tenant-filtered — same reasoning as {@code UserRepository.findByUsernameIgnoreCase}: the
     * request resetting a password is unauthenticated, so no tenant filter is ever enabled for it
     * anyway. {@code tokenHash} is a unique, unguessable 32-byte value, so no cross-tenant
     * ambiguity is possible here regardless.
     */
    @EntityGraph(attributePaths = {"user"})
    Optional<PasswordResetToken> findByTokenHash(String tokenHash);

    /** Every still-usable token for a user — used to invalidate siblings once one is redeemed. */
    List<PasswordResetToken> findByUserIdAndUsedAtIsNull(Long userId);
}
