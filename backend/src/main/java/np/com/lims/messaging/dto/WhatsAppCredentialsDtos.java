package np.com.lims.messaging.dto;

import jakarta.validation.constraints.Size;

public final class WhatsAppCredentialsDtos {

    private WhatsAppCredentialsDtos() {
    }

    /** Never exposes the decrypted access token — only whether one is set. */
    public record Response(boolean enabled, String phoneNumberId, boolean accessTokenConfigured) {
        public static Response empty() {
            return new Response(false, null, false);
        }
    }

    /** Leave the access token blank to keep the existing one — only a non-blank value replaces it. */
    public record UpdateRequest(
            boolean enabled,
            @Size(max = 60) String phoneNumberId,
            @Size(max = 500) String accessToken
    ) {
    }
}
