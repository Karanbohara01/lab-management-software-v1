package np.com.lims.security;

import np.com.lims.common.exception.ApiException;
import np.com.lims.common.exception.ErrorCode;
import org.junit.jupiter.api.Test;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtServiceTest {

    private final JwtService jwtService = new JwtService(new JwtProperties(
            "test-secret-test-secret-test-secret-test-secret",
            Duration.ofMinutes(30),
            Duration.ofDays(7),
            "lims-backend"));

    @Test
    void issuesAndParsesAccessToken() {
        String token = jwtService.issueAccessToken("alice");
        assertThat(jwtService.parseSubject(token, TokenType.ACCESS)).isEqualTo("alice");
    }

    @Test
    void rejectsAccessTokenWhenRefreshExpected() {
        String token = jwtService.issueAccessToken("alice");
        assertThatThrownBy(() -> jwtService.parseSubject(token, TokenType.REFRESH))
                .isInstanceOf(ApiException.class)
                .extracting(e -> ((ApiException) e).errorCode())
                .isEqualTo(ErrorCode.TOKEN_INVALID);
    }

    @Test
    void rejectsTamperedToken() {
        String token = jwtService.issueAccessToken("alice");
        assertThatThrownBy(() -> jwtService.parseSubject(token + "x", TokenType.ACCESS))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void rejectsShortSecret() {
        assertThatThrownBy(() -> new JwtService(new JwtProperties("too-short", Duration.ofMinutes(1),
                Duration.ofDays(1), "lims-backend")))
                .isInstanceOf(IllegalStateException.class);
    }
}
