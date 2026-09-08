package np.com.lims.auth.dto;

public record TokenResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        long expiresInSeconds,
        CurrentUserResponse user
) {
    public static TokenResponse bearer(String access, String refresh, long expiresIn, CurrentUserResponse user) {
        return new TokenResponse(access, refresh, "Bearer", expiresIn, user);
    }
}
