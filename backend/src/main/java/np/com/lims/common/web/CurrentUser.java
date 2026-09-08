package np.com.lims.common.web;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/** Convenience access to the authenticated username for domain event authorship. */
public final class CurrentUser {

    private CurrentUser() {
    }

    public static String username() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null || "anonymousUser".equals(auth.getName())) {
            return "system";
        }
        return auth.getName();
    }

    /** True when the authenticated user holds the given Spring Security authority (e.g. {@code PERM_PATIENT_CONFIDENTIAL}). */
    public static boolean hasAuthority(String authority) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            return false;
        }
        return auth.getAuthorities().stream().anyMatch(a -> authority.equals(a.getAuthority()));
    }
}
