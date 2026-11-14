package np.com.lims.communication;

/**
 * Whether a phone number on file looks like a Nepali mobile number an SMS can actually reach.
 * Patient phone numbers are stored "kept exactly as written" (see {@code ImportField.PHONE}) and
 * can be landlines, numbers with a country code already attached, or junk — this is applied only
 * at the point of building an SMS recipient list / sending an individual message, never used to
 * reject or alter what's stored on the patient record itself.
 */
public final class NepaliPhoneValidator {

    /** 10 digits, starting 97 or 98 — covers every current Nepali mobile prefix (NTC, Ncell, Smart/UTL, Hello). */
    private static final java.util.regex.Pattern MOBILE = java.util.regex.Pattern.compile("^9[78]\\d{8}$");

    private NepaliPhoneValidator() {
    }

    /** Digits only, with a leading country code (+977/977/0) stripped. */
    public static String normalize(String phone) {
        if (phone == null) {
            return "";
        }
        String digits = phone.replaceAll("[^0-9]", "");
        if (digits.startsWith("977") && digits.length() == 13) {
            digits = digits.substring(3);
        } else if (digits.startsWith("0") && digits.length() == 11) {
            digits = digits.substring(1);
        }
        return digits;
    }

    public static boolean isValidMobile(String phone) {
        return MOBILE.matcher(normalize(phone)).matches();
    }
}
