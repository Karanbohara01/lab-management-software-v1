package np.com.lims.patientimport;

import np.com.lims.patient.dto.PatientDtos.AddressDto;
import np.com.lims.patient.dto.PatientDtos.EmergencyContactDto;
import np.com.lims.patient.dto.PatientDtos.UpsertRequest;
import np.com.lims.patient.entity.BloodGroup;
import np.com.lims.patient.entity.Gender;
import np.com.lims.patient.entity.MaritalStatus;
import np.com.lims.patient.entity.PatientCategory;
import np.com.lims.patient.entity.ReferralSourceType;
import np.com.lims.patient.entity.RegistrationChannel;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Turns one spreadsheet row into either a patient ready to create or a reason it cannot be.
 *
 * <p>The rules are the ones the registration desk already enforces — a name, a gender, and either a
 * date of birth or an age — plus the field-level checks that would otherwise fail at the database.
 * Nothing is quietly dropped: a cell that cannot be understood stops the row and is reported with
 * the column it came from, so the administrator can fix the spreadsheet rather than discover later
 * that a thousand patients have no date of birth.
 */
public final class ImportRowMapper {

    private ImportRowMapper() {
    }

    /** The outcome of reading one row. Exactly one of {@code request} or {@code error} is set. */
    public record Mapped(
            UpsertRequest request,
            String errorField,
            String errorMessage,
            Map<String, String> raw,
            String dedupExternalId,
            String dedupPhone,
            String dedupNameKey,
            LocalDate dedupDob
    ) {
        public boolean ok() {
            return request != null;
        }

        static Mapped invalid(Map<String, String> raw, ImportField field, String message) {
            return new Mapped(null, field == null ? null : field.name(), message, raw, null, null, null, null);
        }
    }

    /**
     * Reads a row through the administrator's column mapping.
     *
     * @param cells   the row as read from the file
     * @param mapping source column index to the patient field it feeds
     */
    public static Mapped map(List<String> cells, Map<Integer, ImportField> mapping) {
        Map<ImportField, String> values = new LinkedHashMap<>();
        Map<String, String> raw = new LinkedHashMap<>();
        for (Map.Entry<Integer, ImportField> entry : mapping.entrySet()) {
            int index = entry.getKey();
            String cell = index >= 0 && index < cells.size() ? cells.get(index) : null;
            String value = ImportValueParser.text(cell);
            values.put(entry.getValue(), value);
            if (value != null) {
                raw.put(entry.getValue().name(), value);
            }
        }

        String fullName = values.get(ImportField.FULL_NAME);
        if (fullName == null) {
            return Mapped.invalid(raw, ImportField.FULL_NAME, "The patient's name is missing.");
        }
        if (fullName.length() > 160) {
            return Mapped.invalid(raw, ImportField.FULL_NAME, "The name is longer than 160 characters.");
        }

        String genderRaw = values.get(ImportField.GENDER);
        if (genderRaw == null) {
            return Mapped.invalid(raw, ImportField.GENDER, "Gender is missing. Use Male, Female or Other.");
        }
        Optional<Gender> gender = ImportValueParser.gender(genderRaw);
        if (gender.isEmpty()) {
            return Mapped.invalid(raw, ImportField.GENDER,
                    "\"" + genderRaw + "\" is not a gender this system recognises. Use Male, Female or Other.");
        }

        // Either a date of birth or an age — the same rule the registration form applies.
        LocalDate dob = null;
        String dobRaw = values.get(ImportField.DATE_OF_BIRTH);
        if (dobRaw != null) {
            Optional<LocalDate> parsed = ImportValueParser.date(dobRaw);
            if (parsed.isEmpty()) {
                return Mapped.invalid(raw, ImportField.DATE_OF_BIRTH,
                        "\"" + dobRaw + "\" is not a date this system can read. Use a form like 1990-04-15 or 15/04/1990.");
            }
            dob = parsed.get();
            if (dob.isAfter(LocalDate.now())) {
                return Mapped.invalid(raw, ImportField.DATE_OF_BIRTH, "The date of birth is in the future.");
            }
            if (dob.isBefore(LocalDate.now().minusYears(150))) {
                return Mapped.invalid(raw, ImportField.DATE_OF_BIRTH, "The date of birth is more than 150 years ago.");
            }
        }

        Integer age = null;
        String ageRaw = values.get(ImportField.AGE_YEARS);
        if (ageRaw != null) {
            Optional<Integer> parsed = ImportValueParser.age(ageRaw);
            if (parsed.isEmpty()) {
                return Mapped.invalid(raw, ImportField.AGE_YEARS, "\"" + ageRaw + "\" is not a number of years.");
            }
            age = parsed.get();
            if (age < 0 || age > 150) {
                return Mapped.invalid(raw, ImportField.AGE_YEARS, "An age of " + age + " years is not possible.");
            }
        }

        if (dob == null && age == null) {
            return Mapped.invalid(raw, ImportField.DATE_OF_BIRTH,
                    "Either a date of birth or an age is required, and this row has neither.");
        }
        // A real date of birth is better than an estimate, so the age is dropped rather than kept
        // alongside it — which is exactly what the patient record does with the pair.
        if (dob != null) {
            age = null;
        }

        String email = values.get(ImportField.EMAIL);
        if (email != null && !ImportValueParser.looksLikeEmail(email)) {
            return Mapped.invalid(raw, ImportField.EMAIL, "\"" + email + "\" is not a valid email address.");
        }
        if (email != null && email.length() > 160) {
            return Mapped.invalid(raw, ImportField.EMAIL, "The email address is longer than 160 characters.");
        }

        BloodGroup bloodGroup = null;
        String bloodRaw = values.get(ImportField.BLOOD_GROUP);
        if (bloodRaw != null) {
            Optional<BloodGroup> parsed = ImportValueParser.bloodGroup(bloodRaw);
            if (parsed.isEmpty()) {
                return Mapped.invalid(raw, ImportField.BLOOD_GROUP,
                        "\"" + bloodRaw + "\" is not a blood group. Use A+, A-, B+, B-, AB+, AB-, O+ or O-.");
            }
            bloodGroup = parsed.get();
        }

        MaritalStatus marital = null;
        String maritalRaw = values.get(ImportField.MARITAL_STATUS);
        if (maritalRaw != null) {
            Optional<MaritalStatus> parsed = ImportValueParser.maritalStatus(maritalRaw);
            if (parsed.isEmpty()) {
                return Mapped.invalid(raw, ImportField.MARITAL_STATUS,
                        "\"" + maritalRaw + "\" is not a marital status. Use Single, Married, Divorced, Widowed or Separated.");
            }
            marital = parsed.get();
        }

        PatientCategory category = PatientCategory.WALK_IN;
        String categoryRaw = values.get(ImportField.CATEGORY);
        if (categoryRaw != null) {
            Optional<PatientCategory> parsed = ImportValueParser.category(categoryRaw);
            if (parsed.isEmpty()) {
                return Mapped.invalid(raw, ImportField.CATEGORY,
                        "\"" + categoryRaw + "\" is not a patient category this system uses.");
            }
            category = parsed.get();
        }

        String externalId = ImportValueParser.text(values.get(ImportField.EXTERNAL_ID), 40);
        String phone = ImportValueParser.phone(values.get(ImportField.PHONE));
        String altPhone = ImportValueParser.phone(values.get(ImportField.ALTERNATE_PHONE));

        AddressDto address = addressOf(values);
        EmergencyContactDto emergency = emergencyOf(values);

        UpsertRequest request = new UpsertRequest(
                ImportValueParser.text(values.get(ImportField.SALUTATION), 16),
                fullName,
                ImportValueParser.text(values.get(ImportField.NAME_LOCAL), 160),
                gender.get(),
                dob,
                age,
                bloodGroup,
                marital,
                ImportValueParser.text(values.get(ImportField.OCCUPATION), 120),
                ImportValueParser.text(values.get(ImportField.NATIONALITY), 60),
                null,
                phone,
                altPhone,
                email,
                address,
                null,
                emergency,
                category,
                RegistrationChannel.IMPORT,
                null,
                externalId,
                referralTypeOf(values),
                ImportValueParser.text(values.get(ImportField.REFERRAL_SOURCE_NAME), 200),
                null,
                notesOf(values),
                false,
                // An import never marks a record confidential: the background worker has no
                // security context to check that permission against.
                false,
                false,
                null,
                false,
                null,
                null,
                List.of(),
                // Set by the import service when the administrator has chosen to create patients
                // that match existing ones; left null otherwise.
                null);

        return new Mapped(request, null, null, raw,
                externalId == null ? null : externalId.toLowerCase(java.util.Locale.ROOT),
                ImportValueParser.phoneKey(phone),
                ImportValueParser.nameKey(fullName),
                dob);
    }

    private static ReferralSourceType referralTypeOf(Map<ImportField, String> values) {
        // A referral name without a doctor record is a referral from outside the system.
        return values.get(ImportField.REFERRAL_SOURCE_NAME) == null
                ? ReferralSourceType.SELF : ReferralSourceType.OTHER;
    }

    /**
     * Remarks, plus the two facts the import cannot store anywhere else: the clinic's own
     * registration date and, when there was no column for it, nothing at all. Writing the original
     * registration date into the notes is honest — the record's own created-on timestamp is when it
     * was imported, and overwriting that would misreport the clinic's history.
     */
    private static String notesOf(Map<ImportField, String> values) {
        String notes = values.get(ImportField.NOTES);
        String registered = values.get(ImportField.REGISTRATION_DATE);
        StringBuilder out = new StringBuilder();
        if (registered != null) {
            String readable = ImportValueParser.date(registered).map(LocalDate::toString).orElse(registered);
            out.append("Originally registered ").append(readable).append('.');
        }
        if (notes != null) {
            if (!out.isEmpty()) {
                out.append(' ');
            }
            out.append(notes);
        }
        if (out.isEmpty()) {
            return null;
        }
        String combined = out.toString();
        return combined.length() <= 1000 ? combined : combined.substring(0, 1000);
    }

    private static AddressDto addressOf(Map<ImportField, String> values) {
        String line = ImportValueParser.text(values.get(ImportField.ADDRESS_LINE), 200);
        String city = ImportValueParser.text(values.get(ImportField.ADDRESS_CITY), 100);
        String municipality = ImportValueParser.text(values.get(ImportField.ADDRESS_MUNICIPALITY), 120);
        String ward = ImportValueParser.text(values.get(ImportField.ADDRESS_WARD), 8);
        String tole = ImportValueParser.text(values.get(ImportField.ADDRESS_TOLE), 120);
        String district = ImportValueParser.text(values.get(ImportField.ADDRESS_DISTRICT), 100);
        String province = ImportValueParser.text(values.get(ImportField.ADDRESS_PROVINCE), 100);
        String country = ImportValueParser.text(values.get(ImportField.ADDRESS_COUNTRY), 60);
        if (line == null && city == null && municipality == null && ward == null && tole == null
                && district == null && province == null && country == null) {
            return null;
        }
        return new AddressDto(line, city, municipality, ward, tole, district, province, country);
    }

    private static EmergencyContactDto emergencyOf(Map<ImportField, String> values) {
        String name = ImportValueParser.text(values.get(ImportField.EMERGENCY_NAME), 120);
        String relationship = ImportValueParser.text(values.get(ImportField.EMERGENCY_RELATIONSHIP), 40);
        String phone = ImportValueParser.phone(values.get(ImportField.EMERGENCY_PHONE));
        if (name == null && relationship == null && phone == null) {
            return null;
        }
        return new EmergencyContactDto(name, relationship, phone, false);
    }
}
