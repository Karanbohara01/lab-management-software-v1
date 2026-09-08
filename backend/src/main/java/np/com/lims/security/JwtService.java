package np.com.lims.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import np.com.lims.common.exception.ApiException;
import np.com.lims.common.exception.ErrorCode;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

@Service
public class JwtService {

    private static final String CLAIM_TYPE = "typ";

    private final JwtProperties properties;
    private final SecretKey key;

    public JwtService(JwtProperties properties) {
        this.properties = properties;
        byte[] secretBytes = properties.secret().getBytes(StandardCharsets.UTF_8);
        if (secretBytes.length < 32) {
            throw new IllegalStateException("lims.security.jwt.secret must be at least 32 bytes");
        }
        this.key = Keys.hmacShaKeyFor(secretBytes);
    }

    public String issueAccessToken(String subject) {
        return issue(subject, TokenType.ACCESS, properties.accessTokenTtl().toSeconds());
    }

    public String issueRefreshToken(String subject) {
        return issue(subject, TokenType.REFRESH, properties.refreshTokenTtl().toSeconds());
    }

    public long accessTokenTtlSeconds() {
        return properties.accessTokenTtl().toSeconds();
    }

    /** Parses and validates a token, asserting the expected type. Throws {@link ApiException} on any failure. */
    public String parseSubject(String token, TokenType expectedType) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .requireIssuer(properties.issuer())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            if (!expectedType.name().equals(claims.get(CLAIM_TYPE, String.class))) {
                throw new ApiException(ErrorCode.TOKEN_INVALID, "Unexpected token type");
            }
            return claims.getSubject();
        } catch (ExpiredJwtException e) {
            throw new ApiException(ErrorCode.TOKEN_EXPIRED, "Token has expired");
        } catch (JwtException | IllegalArgumentException e) {
            throw new ApiException(ErrorCode.TOKEN_INVALID, "Token is invalid");
        }
    }

    private String issue(String subject, TokenType type, long ttlSeconds) {
        Instant now = Instant.now();
        return Jwts.builder()
                .issuer(properties.issuer())
                .subject(subject)
                .claim(CLAIM_TYPE, type.name())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(ttlSeconds)))
                .signWith(key)
                .compact();
    }
}
