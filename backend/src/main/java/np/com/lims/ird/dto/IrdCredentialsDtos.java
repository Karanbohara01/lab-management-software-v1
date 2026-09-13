package np.com.lims.ird.dto;

import jakarta.validation.constraints.Size;

public final class IrdCredentialsDtos {

    private IrdCredentialsDtos() {
    }

    /** Never exposes the decrypted password — only whether one is set. */
    public record Response(boolean enabled, String username, String sellerPan, boolean passwordConfigured) {
        public static Response empty() {
            return new Response(false, null, null, false);
        }
    }

    /** Leave the password blank to keep the existing one — only a non-blank value replaces it. */
    public record UpdateRequest(
            boolean enabled,
            @Size(max = 120) String username,
            @Size(max = 40) String sellerPan,
            @Size(max = 200) String password
    ) {
    }
}
