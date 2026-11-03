package np.com.lims.patientimport.read;

import java.io.Closeable;
import java.util.List;

/**
 * A spreadsheet read one row at a time.
 *
 * <p>Row-at-a-time rather than a returned list, because the whole point is that a 500,000-row file
 * is never held in memory. Implementations pull from the underlying stream as {@link #next()} is
 * called and keep only the current row.
 *
 * <p>Cells come back as strings in the order the file holds them, trailing empty cells trimmed. A
 * short row is a short list, not a list padded with nulls — the caller addresses cells by index and
 * treats anything past the end as blank.
 */
public interface TabularReader extends Closeable {

    /**
     * The next row, or null at end of file. The returned list is only valid until the following
     * call.
     */
    List<String> next() throws Exception;

    /** The 1-based line number of the row just returned, as the administrator would count it in Excel. */
    int rowNumber();

    /** The sheet being read, where the format has such a thing. */
    default String sheetName() {
        return null;
    }
}
