package np.com.lims.revenue;

import np.com.lims.common.exception.ApiException;
import np.com.lims.revenue.RevenuePeriod.Preset;
import np.com.lims.revenue.RevenuePeriod.Range;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class RevenuePeriodTest {

    // A Wednesday, chosen so "this week" and "last week" have unambiguous Monday boundaries.
    private static final LocalDate WED = LocalDate.of(2026, 11, 4);

    @Test
    void dayBoundsAreTheLaboratorysMidnightsInUtc() {
        Range today = new Range(WED, WED);
        // Kathmandu is UTC+05:45, so the lab's 4 Nov starts at 18:15 UTC on the 3rd …
        assertThat(today.start()).isEqualTo(Instant.parse("2026-11-03T18:15:00Z"));
        // … and the exclusive end is the lab's midnight at the start of the 5th.
        assertThat(today.endExclusive()).isEqualTo(Instant.parse("2026-11-04T18:15:00Z"));
        assertThat(today.days()).isEqualTo(1);
        assertThat(today.zoneOffsetLiteral()).isEqualTo("+05:45");
    }

    @Test
    void endDateIsInclusive() {
        Range r = new Range(LocalDate.of(2026, 11, 1), LocalDate.of(2026, 11, 30));
        assertThat(r.days()).isEqualTo(30);
        assertThat(r.endExclusive()).isEqualTo(LocalDate.of(2026, 12, 1).atStartOfDay(RevenuePeriod.ZONE).toInstant());
    }

    @Test
    void presetsFollowTheLaboratoryCalendar() {
        assertThat(RevenuePeriod.of(Preset.TODAY, WED)).isEqualTo(new Range(WED, WED));
        assertThat(RevenuePeriod.of(Preset.YESTERDAY, WED)).isEqualTo(new Range(WED.minusDays(1), WED.minusDays(1)));
        assertThat(RevenuePeriod.of(Preset.LAST_7_DAYS, WED)).isEqualTo(new Range(LocalDate.of(2026, 10, 29), WED));
        assertThat(RevenuePeriod.of(Preset.LAST_30_DAYS, WED)).isEqualTo(new Range(LocalDate.of(2026, 10, 6), WED));
        // ISO weeks start on Monday; "this week" runs up to today, not into the future.
        assertThat(RevenuePeriod.of(Preset.THIS_WEEK, WED)).isEqualTo(new Range(LocalDate.of(2026, 11, 2), WED));
        assertThat(RevenuePeriod.of(Preset.LAST_WEEK, WED)).isEqualTo(new Range(LocalDate.of(2026, 10, 26), LocalDate.of(2026, 11, 1)));
        assertThat(RevenuePeriod.of(Preset.THIS_MONTH, WED)).isEqualTo(new Range(LocalDate.of(2026, 11, 1), WED));
        assertThat(RevenuePeriod.of(Preset.LAST_MONTH, WED)).isEqualTo(new Range(LocalDate.of(2026, 10, 1), LocalDate.of(2026, 10, 31)));
        assertThat(RevenuePeriod.of(Preset.THIS_YEAR, WED)).isEqualTo(new Range(LocalDate.of(2026, 1, 1), WED));
    }

    @Test
    void lastWeekOnAMondayIsTheWholePreviousWeek() {
        LocalDate monday = LocalDate.of(2026, 11, 2);
        assertThat(RevenuePeriod.of(Preset.THIS_WEEK, monday)).isEqualTo(new Range(monday, monday));
        assertThat(RevenuePeriod.of(Preset.LAST_WEEK, monday)).isEqualTo(new Range(LocalDate.of(2026, 10, 26), LocalDate.of(2026, 11, 1)));
    }

    @Test
    void lastMonthAcrossAYearBoundary() {
        assertThat(RevenuePeriod.of(Preset.LAST_MONTH, LocalDate.of(2027, 1, 15)))
                .isEqualTo(new Range(LocalDate.of(2026, 12, 1), LocalDate.of(2026, 12, 31)));
    }

    @Test
    void previousPeriodIsTheSameLengthEndingTheDayBefore() {
        Range r = new Range(LocalDate.of(2026, 11, 1), LocalDate.of(2026, 11, 7));
        assertThat(r.previous()).isEqualTo(new Range(LocalDate.of(2026, 10, 25), LocalDate.of(2026, 10, 31)));
        assertThat(r.previous().days()).isEqualTo(r.days());
        // The two windows butt up against each other with no gap and no overlap.
        assertThat(r.previous().endExclusive()).isEqualTo(r.start());
    }

    @Test
    void presetWinsOverExplicitDatesAndNothingMeansToday() {
        LocalDate today = RevenuePeriod.today();
        assertThat(RevenuePeriod.resolve(Preset.YESTERDAY, LocalDate.of(2020, 1, 1), LocalDate.of(2020, 1, 2)))
                .isEqualTo(new Range(today.minusDays(1), today.minusDays(1)));
        assertThat(RevenuePeriod.resolve(null, null, null)).isEqualTo(new Range(today, today));
        assertThat(RevenuePeriod.resolve(null, LocalDate.of(2026, 1, 1), LocalDate.of(2026, 1, 31)))
                .isEqualTo(new Range(LocalDate.of(2026, 1, 1), LocalDate.of(2026, 1, 31)));
    }

    @Test
    void rejectsHalfAndInvertedAndOversizedRanges() {
        assertThatThrownBy(() -> RevenuePeriod.resolve(null, LocalDate.of(2026, 1, 1), null))
                .isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> new Range(LocalDate.of(2026, 2, 1), LocalDate.of(2026, 1, 1)))
                .isInstanceOf(ApiException.class).hasMessageContaining("end date");
        assertThatThrownBy(() -> new Range(LocalDate.of(2020, 1, 1), LocalDate.of(2026, 1, 1)))
                .isInstanceOf(ApiException.class).hasMessageContaining("at most");
    }
}
