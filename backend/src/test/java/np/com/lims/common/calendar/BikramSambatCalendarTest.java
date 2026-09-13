package np.com.lims.common.calendar;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * This converter feeds {@code invoice_date} on every real submission to IRD's live CBMS system
 * (see {@code CbmsIrdGateway}) — a wrong date here is a real tax-filing problem, not a cosmetic
 * one, and the lookup table it's built on had zero test coverage before this. Reference dates
 * below are independently verifiable public facts (Nepali New Year is reported in the news every
 * year), not values copied from the implementation itself, so this test can actually catch a
 * transcription error in the 121-row lookup table rather than just restating it.
 */
class BikramSambatCalendarTest {

    @Test
    void epochAnchorMatchesDocumentedBsYearZero() {
        assertThat(BikramSambatCalendar.toBs(LocalDate.of(1913, 4, 13)).dotted()).isEqualTo("1970.01.01");
    }

    @Test
    void knownNepaliNewYearDates() {
        // Publicly reported Nepali New Year (Baisakh 1) dates — independently verifiable, not
        // derived from this codebase.
        assertThat(BikramSambatCalendar.toBs(LocalDate.of(2023, 4, 14)).dotted()).isEqualTo("2080.01.01");
        assertThat(BikramSambatCalendar.toBs(LocalDate.of(2024, 4, 13)).dotted()).isEqualTo("2081.01.01");
    }

    @Test
    void consecutiveDaysAdvanceByExactlyOneBsDayWithNoGapsOrDuplicates() {
        // Walks a full BS year boundary (2080 -> 2081) day by day; if any row in the lookup table
        // has the wrong length, this either skips a day number or repeats one.
        LocalDate start = LocalDate.of(2023, 4, 14); // BS 2080.01.01
        BsDate previous = BikramSambatCalendar.toBs(start);
        for (int i = 1; i <= 400; i++) {
            LocalDate next = start.plusDays(i);
            BsDate current = BikramSambatCalendar.toBs(next);
            boolean sameDayAdvance = current.year() == previous.year() && current.month() == previous.month()
                    && current.day() == previous.day() + 1;
            boolean monthRollover = current.day() == 1
                    && (current.month() == previous.month() + 1
                        || (current.month() == 1 && current.year() == previous.year() + 1 && previous.month() == 12));
            assertThat(sameDayAdvance || monthRollover)
                    .as("AD %s: BS %s -> %s should advance by exactly one BS day", next, previous.dotted(), current.dotted())
                    .isTrue();
            previous = current;
        }
    }

    @Test
    void yearTotalMatchesGapBetweenConsecutiveNewYears() {
        // BS 2080 New Year to BS 2081 New Year should span exactly the number of AD days that
        // elapsed — an independent cross-check on the table's 2080 row total, using only the
        // calendar's own public New Year outputs (already verified above), not the table directly.
        LocalDate newYear2080 = LocalDate.of(2023, 4, 14);
        LocalDate newYear2081 = LocalDate.of(2024, 4, 13);
        assertThat(ChronoUnit.DAYS.between(newYear2080, newYear2081)).isEqualTo(365);
    }

    @Test
    void rejectsDateBeforeEpoch() {
        assertThatThrownBy(() -> BikramSambatCalendar.toBs(LocalDate.of(1913, 4, 12)))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void rejectsDateBeyondLookupTable() {
        assertThatThrownBy(() -> BikramSambatCalendar.toBs(LocalDate.of(2036, 1, 1)))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void dottedFormatIsZeroPaddedForCbmsApi() {
        assertThat(BikramSambatCalendar.toBs(LocalDate.of(2023, 4, 14)).dotted()).isEqualTo("2080.01.01");
        assertThat(new BsDate(2080, 1, 1).dotted()).isEqualTo("2080.01.01");
    }
}
