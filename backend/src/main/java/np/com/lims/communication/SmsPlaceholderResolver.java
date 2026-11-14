package np.com.lims.communication;

import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Fills {@code {placeholder}} tokens in an {@code SmsTemplate}/campaign message body with
 * per-recipient values. An unresolved placeholder (misspelled, or one the caller didn't supply a
 * value for) is left exactly as written rather than silently blanked — a composer preview or a
 * sent message with a literal {@code {patientName}} in it is an honest, visible signal that
 * something is misconfigured; a blank gap in the middle of a sentence is not.
 */
public final class SmsPlaceholderResolver {

    private static final Pattern TOKEN = Pattern.compile("\\{(\\w+)}");

    private SmsPlaceholderResolver() {
    }

    /** The supported placeholder names, for the template editor's "insert placeholder" picker. */
    public static final java.util.List<String> SUPPORTED = java.util.List.of(
            "patientName", "mrn", "labName", "reportNumber", "appointmentDate", "appointmentTime",
            "orderNumber", "invoiceNumber", "amount", "dueDate", "doctorName", "testNames");

    public static String resolve(String template, Map<String, String> values) {
        if (template == null) {
            return "";
        }
        Matcher matcher = TOKEN.matcher(template);
        StringBuilder out = new StringBuilder();
        while (matcher.find()) {
            String key = matcher.group(1);
            String value = values.get(key);
            matcher.appendReplacement(out, Matcher.quoteReplacement(value != null ? value : matcher.group()));
        }
        matcher.appendTail(out);
        return out.toString();
    }
}
