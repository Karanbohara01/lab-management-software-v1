package np.com.lims.patientimport;

import np.com.lims.patient.entity.BloodGroup;
import np.com.lims.patient.entity.Gender;
import np.com.lims.patient.entity.MaritalStatus;
import np.com.lims.patient.entity.PatientCategory;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

/**
 * Turns what a clinic actually typed into the values the patient record holds.
 *
 * <p>Spreadsheets kept by hand over years are not tidy: a gender column holds "M", "male", "पुरुष"
 * and "1"; a date of birth is written four ways in the same file; a phone number has arrived as a
 * number and lost its leading zero. Every conversion here is deliberate and reversible to explain —
 * nothing silently guesses, and anything it cannot read is reported as an error against that field
 * rather than quietly blanked.
 */
public final class ImportValueParser {

    private ImportValueParser() {
    }

    /**
     * Date patterns tried in order. Unambiguous ones come first; the day-first forms come before
     * the month-first ones because Nepal, like most of the world outside the United States, writes
     * 01/02/2020 as the first of February.
     */
    private static final List<DateTimeFormatter> DATE_FORMATS = List.of(
            DateTimeFormatter.ISO_LOCAL_DATE,
            DateTimeFormatter.ofPattern("yyyy/MM/dd", Locale.ROOT),
            DateTimeFormatter.ofPattern("yyyy.MM.dd", Locale.ROOT),
            DateTimeFormatter.ofPattern("dd-MM-yyyy", Locale.ROOT),
            DateTimeFormatter.ofPattern("dd/MM/yyyy", Locale.ROOT),
            DateTimeFormatter.ofPattern("dd.MM.yyyy", Locale.ROOT),
            DateTimeFormatter.ofPattern("d-M-yyyy", Locale.ROOT),
            DateTimeFormatter.ofPattern("d/M/yyyy", Locale.ROOT),
            DateTimeFormatter.ofPattern("dd-MMM-yyyy", Locale.ENGLISH),
            DateTimeFormatter.ofPattern("d-MMM-yyyy", Locale.ENGLISH),
            DateTimeFormatter.ofPattern("dd MMM yyyy", Locale.ENGLISH),
            DateTimeFormatter.ofPattern("MMM d, yyyy", Locale.ENGLISH),
            DateTimeFormatter.ofPattern("MMMM d, yyyy", Locale.ENGLISH),
            DateTimeFormatter.ofPattern("dd-MM-yy", Locale.ROOT),
            DateTimeFormatter.ofPattern("dd/MM/yy", Locale.ROOT));

    private static final Map<String, Gender> GENDERS = Map.ofEntries(
            Map.entry("m", Gender.MALE), Map.entry("male", Gender.MALE), Map.entry("man", Gender.MALE),
            Map.entry("boy", Gender.MALE), Map.entry("1", Gender.MALE), Map.entry("पुरुष", Gender.MALE),
            Map.entry("पु", Gender.MALE),
            Map.entry("f", Gender.FEMALE), Map.entry("female", Gender.FEMALE), Map.entry("woman", Gender.FEMALE),
            Map.entry("girl", Gender.FEMALE), Map.entry("2", Gender.FEMALE), Map.entry("महिला", Gender.FEMALE),
            Map.entry("म", Gender.FEMALE),
            Map.entry("o", Gender.OTHER), Map.entry("other", Gender.OTHER), Map.entry("others", Gender.OTHER),
            Map.entry("3", Gender.OTHER), Map.entry("x", Gender.OTHER), Map.entry("अन्य", Gender.OTHER));

    private static final Map<String, MaritalStatus> MARITAL = Map.ofEntries(
            Map.entry("single", MaritalStatus.SINGLE), Map.entry("unmarried", MaritalStatus.SINGLE),
            Map.entry("s", MaritalStatus.SINGLE), Map.entry("bachelor", MaritalStatus.SINGLE),
            Map.entry("married", MaritalStatus.MARRIED), Map.entry("m", MaritalStatus.MARRIED),
            Map.entry("divorced", MaritalStatus.DIVORCED), Map.entry("d", MaritalStatus.DIVORCED),
            Map.entry("widowed", MaritalStatus.WIDOWED), Map.entry("widow", MaritalStatus.WIDOWED),
            Map.entry("widower", MaritalStatus.WIDOWED), Map.entry("w", MaritalStatus.WIDOWED),
            Map.entry("separated", MaritalStatus.SEPARATED),
            Map.entry("unknown", MaritalStatus.UNKNOWN), Map.entry("na", MaritalStatus.UNKNOWN));

    private static final Map<String, PatientCategory> CATEGORIES = Map.ofEntries(
            Map.entry("walk in", PatientCategory.WALK_IN), Map.entry("walkin", PatientCategory.WALK_IN),
            Map.entry("direct", PatientCategory.WALK_IN), Map.entry("self", PatientCategory.WALK_IN),
            Map.entry("opd", PatientCategory.OPD_REFERRAL), Map.entry("opd referral", PatientCategory.OPD_REFERRAL),
            Map.entry("outpatient", PatientCategory.OPD_REFERRAL),
            Map.entry("ipd", PatientCategory.IPD), Map.entry("inpatient", PatientCategory.IPD),
            Map.entry("admitted", PatientCategory.IPD),
            Map.entry("health camp", PatientCategory.HEALTH_CAMP), Map.entry("camp", PatientCategory.HEALTH_CAMP),
            Map.entry("corporate", PatientCategory.CORPORATE), Map.entry("company", PatientCategory.CORPORATE),
            Map.entry("insurance", PatientCategory.INSURANCE), Map.entry("insured", PatientCategory.INSURANCE),
            Map.entry("medico legal", PatientCategory.MEDICO_LEGAL), Map.entry("mlc", PatientCategory.MEDICO_LEGAL),
            Map.entry("staff", PatientCategory.STAFF), Map.entry("employee", PatientCategory.STAFF),
            Map.entry("research", PatientCategory.RESEARCH));

    /** Collapses a cell to its comparable form for enum lookup. */
    private static String key(String raw) {
        return ImportField.normalizeHeader(raw);
    }

    public static String text(String raw) {
        if (raw == null) {
            return null;
        }
        String trimmed = raw.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    /** Trims and caps at the column's length, so a long free-text cell cannot fail the insert. */
    public static String text(String raw, int maxLength) {
        String value = text(raw);
        if (value == null) {
            return null;
        }
        return value.length() <= maxLength ? value : value.substring(0, maxLength);
    }

    public static Optional<Gender> gender(String raw) {
        String k = key(raw);
        if (k.isEmpty()) {
            return Optional.empty();
        }
        Gender mapped = GENDERS.get(k);
        if (mapped != null) {
            return Optional.of(mapped);
        }
        for (Gender g : Gender.values()) {
            if (g.name().toLowerCase(Locale.ROOT).equals(k)) {
                return Optional.of(g);
            }
        }
        return Optional.empty();
    }

    public static Optional<MaritalStatus> maritalStatus(String raw) {
        String k = key(raw);
        if (k.isEmpty()) {
            return Optional.empty();
        }
        MaritalStatus mapped = MARITAL.get(k);
        if (mapped != null) {
            return Optional.of(mapped);
        }
        for (MaritalStatus m : MaritalStatus.values()) {
            if (m.name().toLowerCase(Locale.ROOT).replace('_', ' ').equals(k)) {
                return Optional.of(m);
            }
        }
        return Optional.empty();
    }

    public static Optional<PatientCategory> category(String raw) {
        String k = key(raw);
        if (k.isEmpty()) {
            return Optional.empty();
        }
        PatientCategory mapped = CATEGORIES.get(k);
        if (mapped != null) {
            return Optional.of(mapped);
        }
        for (PatientCategory c : PatientCategory.values()) {
            if (c.name().toLowerCase(Locale.ROOT).replace('_', ' ').equals(k)) {
                return Optional.of(c);
            }
        }
        return Optional.empty();
    }

    /** "O+", "o positive", "B -ve" and the enum's own name all resolve. */
    public static Optional<BloodGroup> bloodGroup(String raw) {
        String value = text(raw);
        if (value == null) {
            return Optional.empty();
        }
        String compact = value.toUpperCase(Locale.ROOT).replaceAll("\\s+", "");
        compact = compact.replace("POSITIVE", "+").replace("POS", "+").replace("+VE", "+")
                .replace("NEGATIVE", "-").replace("NEG", "-").replace("-VE", "-");
        for (BloodGroup bg : BloodGroup.values()) {
            if (bg.label().equalsIgnoreCase(compact) || bg.name().equalsIgnoreCase(value.replace(' ', '_'))) {
                return Optional.of(bg);
            }
        }
        if (compact.equals("UNKNOWN") || compact.equals("NA") || compact.equals("-")) {
            return Optional.of(BloodGroup.UNKNOWN);
        }
        return Optional.empty();
    }

    /**
     * A date, from any of the common written forms or from an Excel serial number that arrived as
     * plain digits. Returns empty when the cell cannot be read as a date at all — the caller turns
     * that into a row error naming the field, rather than importing the patient without it.
     */
    public static Optional<LocalDate> date(String raw) {
        String value = text(raw);
        if (value == null) {
            return Optional.empty();
        }
        String cleaned = value.replaceAll("\\s+", " ").trim();
        // A date cell read from a CSV, or from an .xlsx column that was never styled as a date,
        // arrives as the raw serial number.
        if (cleaned.matches("\\d{5}(\\.\\d+)?")) {
            String converted = np.com.lims.patientimport.read.XlsxReader.toDate(cleaned);
            if (converted != null) {
                return Optional.of(LocalDate.parse(converted));
            }
        }
        // Drop a trailing time, which exports often append to a date of birth.
        int timeSeparator = cleaned.indexOf(' ');
        String datePart = timeSeparator > 0 && cleaned.substring(timeSeparator).matches(".*\\d:\\d.*")
                ? cleaned.substring(0, timeSeparator) : cleaned;
        if (datePart.contains("T") && datePart.length() > 10) {
            datePart = datePart.substring(0, datePart.indexOf('T'));
        }
        for (DateTimeFormatter format : DATE_FORMATS) {
            try {
                return Optional.of(LocalDate.parse(datePart, format));
            } catch (DateTimeParseException ignored) {
                // Try the next shape.
            }
        }
        return Optional.empty();
    }

    /** A whole number of years, or empty when the cell is not one. */
    public static Optional<Integer> age(String raw) {
        String value = text(raw);
        if (value == null) {
            return Optional.empty();
        }
        // "35 years", "35 yrs", "35.0" all mean 35.
        String digits = value.replaceAll("[^0-9.]", "");
        if (digits.isEmpty()) {
            return Optional.empty();
        }
        try {
            return Optional.of((int) Math.floor(Double.parseDouble(digits)));
        } catch (NumberFormatException e) {
            return Optional.empty();
        }
    }

    /**
     * A phone number as the clinic wrote it, tidied but never reinterpreted. Spaces, dashes and
     * brackets go; the digits, any leading zero and any {@code +} country code stay exactly as
     * given, because a phone number is an identifier and not a quantity.
     */
    public static String phone(String raw) {
        String value = text(raw);
        if (value == null) {
            return null;
        }
        String cleaned = value.replaceAll("[\\s()\\-./]", "");
        if (cleaned.isEmpty()) {
            return null;
        }
        return cleaned.length() <= 32 ? cleaned : cleaned.substring(0, 32);
    }

    /**
     * The comparison key for a phone number: the last ten digits, matching how the patient record's
     * own search key is built, so an imported number matches an existing patient written a
     * different way. Too short to identify anyone gives null.
     */
    public static String phoneKey(String raw) {
        if (raw == null) {
            return null;
        }
        String digits = raw.replaceAll("\\D", "");
        if (digits.length() < 7) {
            return null;
        }
        return digits.length() > 10 ? digits.substring(digits.length() - 10) : digits;
    }

    /**
     * The comparison key for a name: lowercase, punctuation collapsed, words sorted so "Rai Sita"
     * and "Sita Rai" match. Unicode is kept — a Devanagari name keys on its own letters rather than
     * being stripped to nothing.
     */
    public static String nameKey(String raw) {
        String value = text(raw);
        if (value == null) {
            return null;
        }
        String normalized = java.text.Normalizer.normalize(value, java.text.Normalizer.Form.NFKC)
                .toLowerCase(Locale.ROOT)
                // Marks kept, so a Devanagari name keeps its vowel signs rather than being reduced
                // to bare consonants that would match the wrong people.
                .replaceAll("[^\\p{L}\\p{N}\\p{M}]+", " ")
                .trim();
        if (normalized.isEmpty()) {
            return null;
        }
        String sorted = java.util.Arrays.stream(normalized.split("\\s+")).sorted().reduce("", (a, b) -> a + " " + b).trim();
        return sorted.length() <= 191 ? sorted : sorted.substring(0, 191);
    }

    /** A loose email check: one @, something either side, a dot in the domain. */
    public static boolean looksLikeEmail(String value) {
        return value != null && value.matches("[^@\\s]+@[^@\\s]+\\.[^@\\s]+");
    }
}
