package np.com.lims.revenue;

import np.com.lims.common.exception.ApiException;
import np.com.lims.common.exception.ErrorCode;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;

/**
 * The reporting window for every revenue figure, resolved once and shared by the dashboard, the
 * printed report and the registers — so all of them are cut at exactly the same two instants.
 *
 * <p>Days are the laboratory's days. Every financial timestamp is stored as UTC
 * ({@code hibernate.jdbc.time_zone: UTC}), but "today's collections" has to mean the cashier's
 * working day in Kathmandu, not a day that starts at 05:45 local time; the range is therefore
 * expressed as inclusive local dates and converted to a half-open {@code [start, end)} pair of
 * instants in {@link #ZONE}. Half-open, matching the convention the existing Sales Book and
 * Master Bill queries use, so a payment stamped at the final microsecond of a day is neither lost
 * nor counted twice.
 *
 * <p>Note the statutory IRD reports ({@code InvoiceService.salesBook} and friends) cut calendar
 * months at UTC midnight. That is a pre-existing choice in legally sensitive code and is left
 * untouched; a month here and the same month there can differ by the invoices issued in the first
 * and last 5h45m of the month.
 */
public final class RevenuePeriod {

    public static final ZoneId ZONE = ZoneId.of("Asia/Kathmandu");

    /** Five years of day-level trend is the most the charts and registers are built to carry. */
    public static final int MAX_DAYS = 1830;

    private RevenuePeriod() {
    }

    public enum Preset {
        TODAY, YESTERDAY, LAST_7_DAYS, LAST_30_DAYS, THIS_WEEK, LAST_WEEK, THIS_MONTH, LAST_MONTH, THIS_YEAR
    }

    /** Inclusive local-date bounds. */
    public record Range(LocalDate from, LocalDate to) {

        public Range {
            if (from == null || to == null) {
                throw new ApiException(ErrorCode.VALIDATION_FAILED, "Both a start and an end date are required");
            }
            if (to.isBefore(from)) {
                throw new ApiException(ErrorCode.VALIDATION_FAILED, "The end date must not be before the start date");
            }
            if (ChronoUnit.DAYS.between(from, to) + 1 > MAX_DAYS) {
                throw new ApiException(ErrorCode.VALIDATION_FAILED,
                        "A revenue report can cover at most " + MAX_DAYS + " days");
            }
        }

        /** First instant of the first day, in the laboratory's zone. */
        public Instant start() {
            return from.atStartOfDay(ZONE).toInstant();
        }

        /** First instant of the day AFTER the last day — the exclusive upper bound. */
        public Instant endExclusive() {
            return to.plusDays(1).atStartOfDay(ZONE).toInstant();
        }

        public long days() {
            return ChronoUnit.DAYS.between(from, to) + 1;
        }

        /** The window of equal length immediately before this one, for period-over-period comparison. */
        public Range previous() {
            long n = days();
            return new Range(from.minusDays(n), from.minusDays(1));
        }

        /**
         * The zone's UTC offset as MySQL's {@code CONVERT_TZ} wants it ({@code +05:45}). Nepal has
         * no daylight saving, so one offset covers the whole range; taken at the start regardless.
         */
        public String zoneOffsetLiteral() {
            ZoneOffset offset = ZONE.getRules().getOffset(start());
            String id = offset.getId(); // "Z" or "+05:45"
            return "Z".equals(id) ? "+00:00" : id;
        }
    }

    public static LocalDate today() {
        return LocalDate.now(ZONE);
    }

    /** Resolves a preset against the laboratory's calendar — ISO weeks (Monday first), Gregorian months and years. */
    public static Range of(Preset preset, LocalDate today) {
        return switch (preset) {
            case TODAY -> new Range(today, today);
            case YESTERDAY -> new Range(today.minusDays(1), today.minusDays(1));
            case LAST_7_DAYS -> new Range(today.minusDays(6), today);
            case LAST_30_DAYS -> new Range(today.minusDays(29), today);
            case THIS_WEEK -> new Range(today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)), today);
            case LAST_WEEK -> {
                LocalDate thisMonday = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
                yield new Range(thisMonday.minusWeeks(1), thisMonday.minusDays(1));
            }
            case THIS_MONTH -> new Range(today.withDayOfMonth(1), today);
            case LAST_MONTH -> {
                LocalDate firstOfThisMonth = today.withDayOfMonth(1);
                yield new Range(firstOfThisMonth.minusMonths(1), firstOfThisMonth.minusDays(1));
            }
            case THIS_YEAR -> new Range(today.withDayOfYear(1), today);
        };
    }

    /**
     * What a request asked for: a preset wins when given (its dates are the laboratory's, not the
     * browser's); otherwise explicit dates; otherwise today.
     */
    public static Range resolve(Preset preset, LocalDate from, LocalDate to) {
        if (preset != null) {
            return of(preset, today());
        }
        if (from == null && to == null) {
            return of(Preset.TODAY, today());
        }
        return new Range(from, to);
    }
}
