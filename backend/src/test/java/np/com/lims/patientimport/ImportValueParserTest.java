package np.com.lims.patientimport;

import np.com.lims.patient.entity.BloodGroup;
import np.com.lims.patient.entity.Gender;
import np.com.lims.patient.entity.MaritalStatus;
import np.com.lims.patient.entity.PatientCategory;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class ImportValueParserTest {

    @Test
    void readsGenderHoweverTheClinicWroteIt() {
        for (String male : new String[] { "M", "m", "Male", "MALE", "man", "1", "पुरुष" }) {
            assertThat(ImportValueParser.gender(male)).as(male).contains(Gender.MALE);
        }
        for (String female : new String[] { "F", "Female", "FEMALE", "woman", "2", "महिला" }) {
            assertThat(ImportValueParser.gender(female)).as(female).contains(Gender.FEMALE);
        }
        assertThat(ImportValueParser.gender("Other")).contains(Gender.OTHER);
    }

    @Test
    void refusesAGenderItCannotBeSureOf() {
        // Better to stop the row and say so than to guess at something this important.
        assertThat(ImportValueParser.gender("unknown")).isEmpty();
        assertThat(ImportValueParser.gender("")).isEmpty();
        assertThat(ImportValueParser.gender(null)).isEmpty();
    }

    @Test
    void readsTheCommonWrittenDateForms() {
        LocalDate expected = LocalDate.of(1990, 4, 15);
        for (String written : new String[] {
                "1990-04-15", "15/04/1990", "15-04-1990", "15.04.1990", "1990/04/15",
                "15-Apr-1990", "15 Apr 1990", "Apr 15, 1990", "April 15, 1990" }) {
            assertThat(ImportValueParser.date(written)).as(written).contains(expected);
        }
    }

    @Test
    void readsADayFirstDateTheWayNepalWritesIt() {
        // 01/02/2020 is the first of February here, not the second of January.
        assertThat(ImportValueParser.date("01/02/2020")).contains(LocalDate.of(2020, 2, 1));
    }

    @Test
    void readsAnExcelSerialNumberThatArrivedAsPlainDigits() {
        // 32978 is 15 April 1990 in Excel's day count.
        assertThat(ImportValueParser.date("32978")).contains(LocalDate.of(1990, 4, 15));
    }

    @Test
    void dropsATimeAppendedToADateOfBirth() {
        assertThat(ImportValueParser.date("1990-04-15T00:00:00")).contains(LocalDate.of(1990, 4, 15));
        assertThat(ImportValueParser.date("15/04/1990 00:00")).contains(LocalDate.of(1990, 4, 15));
    }

    @Test
    void refusesSomethingThatIsNotADate() {
        assertThat(ImportValueParser.date("not a date")).isEmpty();
        assertThat(ImportValueParser.date("N/A")).isEmpty();
        assertThat(ImportValueParser.date("")).isEmpty();
    }

    @Test
    void readsAnAgeWrittenWithItsUnit() {
        assertThat(ImportValueParser.age("35")).contains(35);
        assertThat(ImportValueParser.age("35 years")).contains(35);
        assertThat(ImportValueParser.age("35 yrs")).contains(35);
        assertThat(ImportValueParser.age("35.0")).contains(35);
        assertThat(ImportValueParser.age("abc")).isEmpty();
    }

    @Test
    void keepsAPhoneNumberExactlyAsWrittenApartFromPunctuation() {
        assertThat(ImportValueParser.phone("980-123-4567")).isEqualTo("9801234567");
        assertThat(ImportValueParser.phone("(01) 4567 890")).isEqualTo("014567890");
        // A leading zero is part of the number, not a quantity to be normalised away.
        assertThat(ImportValueParser.phone("014567890")).isEqualTo("014567890");
        assertThat(ImportValueParser.phone("+977 9801234567")).isEqualTo("+9779801234567");
    }

    @Test
    void matchesPhonesOnTheirLastTenDigitsTheWayTheRecordDoes() {
        assertThat(ImportValueParser.phoneKey("+977 9801234567")).isEqualTo("9801234567");
        assertThat(ImportValueParser.phoneKey("980-123-4567")).isEqualTo("9801234567");
        assertThat(ImportValueParser.phoneKey("9801234567")).isEqualTo("9801234567");
        // Too short to identify anyone.
        assertThat(ImportValueParser.phoneKey("12345")).isNull();
    }

    @Test
    void matchesNamesRegardlessOfOrderCaseAndPunctuation() {
        String key = ImportValueParser.nameKey("Sita Rai");
        assertThat(ImportValueParser.nameKey("RAI, SITA")).isEqualTo(key);
        assertThat(ImportValueParser.nameKey("  sita   rai ")).isEqualTo(key);
        assertThat(ImportValueParser.nameKey("Hari Thapa")).isNotEqualTo(key);
    }

    @Test
    void keepsNepaliNamesInsteadOfStrippingThemToNothing() {
        String key = ImportValueParser.nameKey("सीता राई");
        assertThat(key).isNotNull().isNotEmpty();
        assertThat(ImportValueParser.nameKey("राई सीता")).isEqualTo(key);
    }

    @Test
    void readsBloodGroupsHoweverTheyAreWritten() {
        assertThat(ImportValueParser.bloodGroup("O+")).contains(BloodGroup.O_POSITIVE);
        assertThat(ImportValueParser.bloodGroup("o positive")).contains(BloodGroup.O_POSITIVE);
        assertThat(ImportValueParser.bloodGroup("B -ve")).contains(BloodGroup.B_NEGATIVE);
        assertThat(ImportValueParser.bloodGroup("AB+")).contains(BloodGroup.AB_POSITIVE);
        assertThat(ImportValueParser.bloodGroup("A_NEGATIVE")).contains(BloodGroup.A_NEGATIVE);
        assertThat(ImportValueParser.bloodGroup("purple")).isEmpty();
    }

    @Test
    void readsMaritalStatusAndPatientCategory() {
        assertThat(ImportValueParser.maritalStatus("Married")).contains(MaritalStatus.MARRIED);
        assertThat(ImportValueParser.maritalStatus("unmarried")).contains(MaritalStatus.SINGLE);
        assertThat(ImportValueParser.category("OPD")).contains(PatientCategory.OPD_REFERRAL);
        assertThat(ImportValueParser.category("walk-in")).contains(PatientCategory.WALK_IN);
        assertThat(ImportValueParser.category("nonsense")).isEmpty();
    }

    @Test
    void checksEmailLoosely() {
        assertThat(ImportValueParser.looksLikeEmail("sita@example.com")).isTrue();
        assertThat(ImportValueParser.looksLikeEmail("sita.rai@sub.example.np")).isTrue();
        assertThat(ImportValueParser.looksLikeEmail("not-an-email")).isFalse();
        assertThat(ImportValueParser.looksLikeEmail("a@b")).isFalse();
    }

    @Test
    void suggestsTheFieldAHeaderMeans() {
        assertThat(ImportField.suggestFor("Client Name")).contains(ImportField.FULL_NAME);
        assertThat(ImportField.suggestFor("Patient Name")).contains(ImportField.FULL_NAME);
        assertThat(ImportField.suggestFor("Mobile")).contains(ImportField.PHONE);
        assertThat(ImportField.suggestFor("D.O.B.")).contains(ImportField.DATE_OF_BIRTH);
        assertThat(ImportField.suggestFor("Birth Date")).contains(ImportField.DATE_OF_BIRTH);
        assertThat(ImportField.suggestFor("Home Address")).contains(ImportField.ADDRESS_LINE);
        assertThat(ImportField.suggestFor("Sex")).contains(ImportField.GENDER);
        assertThat(ImportField.suggestFor("Old Patient ID")).contains(ImportField.EXTERNAL_ID);
    }

    @Test
    void suggestsNothingForAHeaderItDoesNotRecognise() {
        // A confident wrong guess is worse than leaving it to the administrator.
        assertThat(ImportField.suggestFor("Lab Visit Count")).isEmpty();
        assertThat(ImportField.suggestFor("")).isEmpty();
        assertThat(ImportField.suggestFor(null)).isEmpty();
    }
}
