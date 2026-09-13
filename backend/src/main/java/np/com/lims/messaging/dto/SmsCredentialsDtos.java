package np.com.lims.messaging.dto;

import jakarta.validation.constraints.Size;

public final class SmsCredentialsDtos {

    private SmsCredentialsDtos() {
    }

    /** Never exposes the decrypted token — only whether one is set. */
    public record Response(boolean enabled, String from, boolean tokenConfigured) {
        public static Response empty() {
            return new Response(false, null, false);
        }
    }

    /** Leave the token blank to keep the existing one — only a non-blank value replaces it. */
    public record UpdateRequest(
            boolean enabled,
            @Size(max = 40) String from,
            @Size(max = 200) String token
    ) {
    }
}
