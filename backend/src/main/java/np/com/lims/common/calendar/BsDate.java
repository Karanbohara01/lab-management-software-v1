package np.com.lims.common.calendar;

/** A Bikram Sambat (Nepali calendar) date: year/month/day, months 1 (Baisakh) – 12 (Chaitra). */
public record BsDate(int year, int month, int day) {

    /** Dot-separated form, e.g. {@code "2082.05.24"} — the format IRD's CBMS API requires. */
    public String dotted() {
        return "%d.%02d.%02d".formatted(year, month, day);
    }
}
