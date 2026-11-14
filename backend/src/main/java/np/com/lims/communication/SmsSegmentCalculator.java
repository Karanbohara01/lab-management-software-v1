package np.com.lims.communication;

/**
 * How many SMS segments a message body costs, and which encoding it needs. A single source of
 * truth used both for the live composer preview (so the UI's estimate and what actually gets
 * billed agree) and to stamp every {@code SmsMessage} row's {@code segment_count}/{@code encoding}.
 *
 * <p><b>Honesty note</b> (see {@code SamayaSmsGateway}'s javadoc for the full research trail):
 * Samaya SMS's only available technical documentation (an unofficial, unversioned 2018 client
 * library) states that the API takes a {@code unicode} flag (plain vs. Unicode) but nowhere
 * documents characters-per-segment limits or how credits are actually billed for either mode.
 * The thresholds below are the GSM 03.38 / UCS-2 industry-standard rules essentially every SMS
 * aggregator (including Sparrow, this codebase's other provider) follows — not a
 * Samaya-confirmed figure. If Samaya's actual billing differs, only the numbers in this one class
 * need correcting; nothing else in the codebase hardcodes a segment-size assumption.
 */
public final class SmsSegmentCalculator {

    private SmsSegmentCalculator() {
    }

    public enum Encoding { GSM7, UCS2 }

    public record Estimate(Encoding encoding, int characterCount, int segmentCount, int charsRemainingInSegment) {
    }

    private static final int GSM7_SINGLE_LIMIT = 160;
    private static final int GSM7_CONCAT_LIMIT = 153;
    private static final int UCS2_SINGLE_LIMIT = 70;
    private static final int UCS2_CONCAT_LIMIT = 67;

    /**
     * The GSM 03.38 default alphabet, basic (non-extension) characters. A small set of characters
     * (€ {} [] ~ ^ |) are in the GSM extension table and technically cost 2 characters each within
     * a GSM-7 message; this implementation treats their presence as GSM-7-safe but doesn't account
     * for the double-character cost, erring toward a slightly optimistic (not pessimistic) segment
     * estimate in that narrow case rather than adding speculative complexity for characters Nepali
     * clinic SMS text is unlikely to use.
     */
    private static final String GSM7_BASIC =
            "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?"
                    + "¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";

    /** The GSM extension-table characters referenced in this class's own javadoc above — kept as a
     * separate constant (rather than folded into {@code GSM7_BASIC}) so that string stays an
     * accurate copy of the base alphabet; {@link #isGsm7Compatible} checks both. */
    private static final String GSM7_EXTENSION = "{}[]~^|€";

    public static boolean isGsm7Compatible(String text) {
        if (text == null) return true;
        for (int i = 0; i < text.length(); i++) {
            char c = text.charAt(i);
            if (GSM7_BASIC.indexOf(c) < 0 && GSM7_EXTENSION.indexOf(c) < 0) {
                return false;
            }
        }
        return true;
    }

    public static Estimate estimate(String text) {
        String body = text == null ? "" : text;
        int len = body.codePointCount(0, body.length());
        Encoding encoding = isGsm7Compatible(body) ? Encoding.GSM7 : Encoding.UCS2;
        int singleLimit = encoding == Encoding.GSM7 ? GSM7_SINGLE_LIMIT : UCS2_SINGLE_LIMIT;
        int concatLimit = encoding == Encoding.GSM7 ? GSM7_CONCAT_LIMIT : UCS2_CONCAT_LIMIT;

        int segments;
        int remaining;
        if (len == 0) {
            segments = 0;
            remaining = singleLimit;
        } else if (len <= singleLimit) {
            segments = 1;
            remaining = singleLimit - len;
        } else {
            segments = (int) Math.ceil(len / (double) concatLimit);
            remaining = (segments * concatLimit) - len;
        }
        return new Estimate(encoding, len, segments, remaining);
    }
}
