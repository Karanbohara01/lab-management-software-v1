package np.com.lims.patientimport;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

/**
 * The patient fields a spreadsheet can fill, and the single place that says so. The template, the
 * column-mapping suggestions, the validator and the error reports all read this enum, so a field
 * cannot be offered in one and missing from another.
 *
 * <p>Every entry maps onto a real column of the patient record — nothing here is invented for the
 * import. Fields the system derives for itself (the MRN, the phone search key, portal tokens,
 * consent timestamps) are deliberately absent: a spreadsheet cannot set them.
 *
 * <p>{@code aliases} are the header spellings seen in the wild, normalised the same way an uploaded
 * header is, so "Client Name", "patient_name" and "PATIENT NAME" all find Full name.
 */
public enum ImportField {

    FULL_NAME("Full Name", true,
            "The patient's full name, as it should appear on reports.",
            "Sita Rai",
            "patient name", "name", "client name", "patients name", "patient full name", "fullname", "nam"),

    NAME_LOCAL("Name (Nepali)", false,
            "The name in Devanagari, if the clinic keeps one. Stored alongside the Latin name, not instead of it.",
            "सीता राई",
            "nepali name", "local name", "name nepali", "devanagari name", "name in nepali"),

    SALUTATION("Salutation", false,
            "Mr, Mrs, Ms, Dr and so on.",
            "Mrs",
            "title", "prefix", "honorific"),

    GENDER("Gender", true,
            "Male, Female or Other. M / F / O are accepted, as are the Nepali words.",
            "Female",
            "sex", "gender male female"),

    DATE_OF_BIRTH("Date of Birth", false,
            "Either this or Age is required. Most common date formats are understood.",
            "1990-04-15",
            "dob", "birth date", "birthdate", "date of birth ad", "d o b", "born"),

    AGE_YEARS("Age (years)", false,
            "Use when the date of birth is unknown. Either this or Date of Birth is required.",
            "35",
            "age", "age in years", "approximate age", "years"),

    PHONE("Phone Number", false,
            "The primary contact number. Kept exactly as written.",
            "9801234567",
            "mobile", "mobile number", "contact", "contact number", "phone no", "primary phone", "cell", "telephone"),

    ALTERNATE_PHONE("Alternate Phone", false,
            "A second contact number, if the clinic holds one.",
            "014567890",
            "secondary phone", "alt phone", "other phone", "phone 2", "landline", "home phone"),

    EMAIL("Email", false,
            "Email address.",
            "sita.rai@example.com",
            "e mail", "email address", "mail"),

    EXTERNAL_ID("Existing Patient ID", false,
            "The identifier from the clinic's previous software. Kept as a reference on the record; "
                    + "the system still issues its own new patient number.",
            "OLD-10234",
            "patient id", "old patient id", "existing id", "legacy id", "registration no", "reg no",
            "patient code", "old id", "previous id", "mrn", "uhid", "opd no"),

    BLOOD_GROUP("Blood Group", false,
            "A+, A-, B+, B-, AB+, AB-, O+ or O-.",
            "O+",
            "blood", "blood type", "bloodgroup"),

    MARITAL_STATUS("Marital Status", false,
            "Single, Married, Divorced, Widowed or Separated.",
            "Married",
            "marital", "married"),

    OCCUPATION("Occupation", false, "The patient's occupation.", "Teacher", "job", "profession", "work"),

    NATIONALITY("Nationality", false, "Defaults to Nepali when left blank.", "Nepali", "citizenship country"),

    ADDRESS_LINE("Address", false,
            "The street address. Use the separate columns below for the structured parts, if the clinic keeps them.",
            "Shantinagar, Baneshwor",
            "address line", "full address", "home address", "permanent address", "residential address", "addr"),

    ADDRESS_TOLE("Tole", false, "The tole or locality.", "Shantinagar", "locality", "area", "street"),
    ADDRESS_WARD("Ward No", false, "Ward number.", "10", "ward", "ward number", "wardno"),
    ADDRESS_MUNICIPALITY("Municipality", false, "Municipality or rural municipality.", "Kathmandu Metropolitan City",
            "municipality name", "vdc", "palika", "gaupalika", "nagarpalika"),
    ADDRESS_CITY("City", false, "City or town.", "Kathmandu", "town"),
    ADDRESS_DISTRICT("District", false, "District.", "Kathmandu", "dist"),
    ADDRESS_PROVINCE("Province", false, "Province.", "Bagmati", "state", "zone"),
    ADDRESS_COUNTRY("Country", false, "Defaults to Nepal when left blank.", "Nepal", "nation"),

    EMERGENCY_NAME("Emergency Contact Name", false, "Who to call in an emergency.", "Ram Rai",
            "emergency contact", "guardian name", "next of kin", "emergency person", "contact person"),
    EMERGENCY_RELATIONSHIP("Emergency Contact Relationship", false, "Their relationship to the patient.", "Husband",
            "relation", "relationship", "guardian relation", "kin relationship"),
    EMERGENCY_PHONE("Emergency Contact Phone", false, "Their phone number.", "9807654321",
            "emergency phone", "guardian phone", "emergency number", "kin phone"),

    CATEGORY("Patient Category", false,
            "How the patient reaches the laboratory: Walk-in, OPD referral, IPD, Health camp, Corporate, "
                    + "Insurance, Medico-legal, Staff or Research. Defaults to Walk-in.",
            "Walk-in",
            "type", "patient type", "visit type"),

    REFERRAL_SOURCE_NAME("Referred By", false,
            "The referring doctor or organisation, as free text. Imported as a referral note, not linked to a "
                    + "doctor record.",
            "Dr. Anita Sharma",
            "referred by", "referrer", "reference", "referral", "doctor name", "ref by"),

    REGISTRATION_DATE("Registration Date", false,
            "When the patient first registered with the clinic. Recorded in the notes; the system keeps its own "
                    + "created-on timestamp for the imported record.",
            "2019-06-01",
            "registered on", "reg date", "date registered", "first visit", "registration"),

    NOTES("Remarks", false, "Anything else worth keeping on the record.", "Transferred from old system",
            "remark", "comment", "comments", "note", "description", "other");

    private final String label;
    private final boolean mandatory;
    private final String instruction;
    private final String example;
    private final List<String> aliases;

    ImportField(String label, boolean mandatory, String instruction, String example, String... aliases) {
        this.label = label;
        this.mandatory = mandatory;
        this.instruction = instruction;
        this.example = example;
        this.aliases = List.of(aliases);
    }

    public String label() {
        return label;
    }

    /**
     * True when a row cannot be imported without it. Only the name and gender are strictly required;
     * a date of birth or an age is required too, but either will do, which is checked per row rather
     * than per column.
     */
    public boolean mandatory() {
        return mandatory;
    }

    public String instruction() {
        return instruction;
    }

    public String example() {
        return example;
    }

    public List<String> aliases() {
        return aliases;
    }

    /** True for the pair where exactly one of the two must be present. */
    public static boolean isAgeOrDob(ImportField field) {
        return field == DATE_OF_BIRTH || field == AGE_YEARS;
    }

    /**
     * Reduces a header or a short value to its comparable form: lowercase, punctuation gone, runs of
     * whitespace collapsed. "Patient's D.O.B." and "patient dob" land on the same string.
     *
     * <p>Accents are folded away for Latin text, so "Prénom" matches "prenom". They are NOT folded
     * for anything else: in Devanagari the marks are vowel signs, not decoration, and stripping
     * them turns पुरुष into something that is not a word. The two cases are told apart by looking
     * for a non-Latin letter before deciding.
     */
    public static String normalizeHeader(String header) {
        if (header == null) {
            return "";
        }
        String normalized = hasNonLatinLetter(header)
                ? java.text.Normalizer.normalize(header, java.text.Normalizer.Form.NFKC)
                : java.text.Normalizer.normalize(header, java.text.Normalizer.Form.NFKD).replaceAll("\\p{M}+", "");
        return normalized.toLowerCase(Locale.ROOT)
                // Marks are kept alongside letters and digits: in Devanagari the vowel signs are
                // marks, and dropping them turns पुरुष into three unrelated consonants.
                .replaceAll("[^\\p{L}\\p{N}\\p{M}]+", " ")
                .trim();
    }

    private static boolean hasNonLatinLetter(String value) {
        return value.codePoints().anyMatch(cp -> Character.isLetter(cp)
                && Character.UnicodeScript.of(cp) != Character.UnicodeScript.LATIN);
    }

    /**
     * The field a spreadsheet header most likely means, or empty when nothing matches well enough.
     * An exact match on the field's own label or one of its aliases wins; otherwise a header that
     * contains an alias as a whole word is accepted. Nothing is guessed from a partial word — the
     * administrator reviews every suggestion anyway, and a confident wrong guess is worse than none.
     */
    public static Optional<ImportField> suggestFor(String header) {
        String key = normalizeHeader(header);
        if (key.isEmpty()) {
            return Optional.empty();
        }
        for (ImportField f : values()) {
            if (normalizeHeader(f.label).equals(key) || f.aliases.contains(key)) {
                return Optional.of(f);
            }
        }
        for (ImportField f : values()) {
            if (containsWord(key, normalizeHeader(f.label))) {
                return Optional.of(f);
            }
            for (String alias : f.aliases) {
                if (containsWord(key, alias)) {
                    return Optional.of(f);
                }
            }
        }
        return Optional.empty();
    }

    private static boolean containsWord(String haystack, String needle) {
        if (needle.isEmpty() || needle.length() < 3) {
            return false;
        }
        return (" " + haystack + " ").contains(" " + needle + " ");
    }

    public static List<ImportField> mandatoryFields() {
        return Arrays.stream(values()).filter(ImportField::mandatory).toList();
    }
}
