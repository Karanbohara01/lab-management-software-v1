package np.com.lims.platform.entity;

import np.com.lims.common.exception.ApiException;
import np.com.lims.common.exception.ErrorCode;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Locale;
import java.util.regex.Pattern;

/**
 * The social networks a leadership profile can link to, and what counts as a valid link to each.
 * An address is accepted only if it really points at that network — never another site, and never
 * a {@code javascript:} or other non-web link, because these end up as clickable links on the
 * public landing page.
 */
public enum SocialNetwork {
    LINKEDIN("LinkedIn", "linkedin.com/in/your-name", "linkedin.com"),
    FACEBOOK("Facebook", "facebook.com/your.name", "facebook.com", "fb.com"),
    INSTAGRAM("Instagram", "instagram.com/your.name", "instagram.com"),
    THREADS("Threads", "threads.net/@your.name", "threads.net", "threads.com");

    static final int MAX_LENGTH = 300;
    private static final Pattern HAS_SCHEME = Pattern.compile("^[A-Za-z][A-Za-z0-9+.-]*:.*");

    private final String label;
    private final String example;
    private final String[] domains;

    SocialNetwork(String label, String example, String... domains) {
        this.label = label;
        this.example = example;
        this.domains = domains;
    }

    /**
     * The cleaned-up address, or null if none was given. A bare {@code linkedin.com/in/x} gets
     * {@code https://} in front, and {@code http://} is upgraded to {@code https://}.
     */
    public String normalise(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String text = raw.trim();
        if (text.length() > MAX_LENGTH) {
            throw invalid();
        }
        boolean web = text.regionMatches(true, 0, "http://", 0, 7) || text.regionMatches(true, 0, "https://", 0, 8);
        if (HAS_SCHEME.matcher(text).matches() && !web) {
            throw invalid(); // javascript:, data:, mailto:, ... — not a web page
        }
        String withScheme = web ? text : "https://" + text;
        URI uri;
        try {
            uri = new URI(withScheme);
        } catch (URISyntaxException e) {
            throw invalid();
        }
        String host = uri.getHost() == null ? "" : uri.getHost().toLowerCase(Locale.ROOT);
        if (uri.getUserInfo() != null || !hostMatches(host)) {
            throw invalid();
        }
        return "https" + withScheme.substring(withScheme.indexOf("://"));
    }

    private boolean hostMatches(String host) {
        for (String domain : domains) {
            if (host.equals(domain) || host.endsWith("." + domain)) {
                return true;
            }
        }
        return false;
    }

    private ApiException invalid() {
        return new ApiException(ErrorCode.VALIDATION_FAILED,
                "Enter a " + label + " address, such as " + example + ".");
    }
}
