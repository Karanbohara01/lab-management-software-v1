package np.com.lims.patientimport.read;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * A streaming RFC 4180 reader for the CSV and tab-separated files clinics export from their old
 * software.
 *
 * <p>Written here rather than pulled in as a dependency because the hard parts are few and
 * specific: quoted fields containing the delimiter or a newline, doubled quotes inside a quoted
 * field, a UTF-8 byte-order mark that Excel writes and that would otherwise become part of the
 * first header, and the three line endings in circulation. Everything is read as UTF-8, so Nepali
 * text survives.
 *
 * <p>The delimiter is detected from the header line: whichever of comma, semicolon or tab appears
 * most outside quotes. European Excel exports are semicolon-separated, and a clinic that saved its
 * file as "Text (tab delimited)" is otherwise unreadable.
 */
public class CsvReader implements TabularReader {

    private static final char[] CANDIDATE_DELIMITERS = { ',', ';', '\t', '|' };

    private final BufferedReader reader;
    private final char delimiter;
    private final List<String> current = new ArrayList<>();
    private int rowNumber;
    /** Pushed-back first character when the BOM check read one too many. */
    private int pushback = -1;

    public CsvReader(InputStream in) throws IOException {
        // Mark-and-reset over the raw bytes so the delimiter can be sniffed from the first line and
        // then the whole file read from the beginning.
        BufferedReader buffered = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8), 64 * 1024);
        buffered.mark(64 * 1024);
        String firstLine = buffered.readLine();
        this.delimiter = detectDelimiter(firstLine);
        buffered.reset();
        this.reader = buffered;
    }

    /** The delimiter that splits the header into the most columns, counting only outside quotes. */
    static char detectDelimiter(String headerLine) {
        if (headerLine == null || headerLine.isEmpty()) {
            return ',';
        }
        char best = ',';
        int bestCount = 0;
        for (char candidate : CANDIDATE_DELIMITERS) {
            int count = 0;
            boolean inQuotes = false;
            for (int i = 0; i < headerLine.length(); i++) {
                char c = headerLine.charAt(i);
                if (c == '"') {
                    inQuotes = !inQuotes;
                } else if (c == candidate && !inQuotes) {
                    count++;
                }
            }
            if (count > bestCount) {
                bestCount = count;
                best = candidate;
            }
        }
        return best;
    }

    @Override
    public List<String> next() throws IOException {
        current.clear();
        StringBuilder field = new StringBuilder();
        boolean inQuotes = false;
        boolean sawAnything = false;

        while (true) {
            int ch = read();
            if (ch == -1) {
                if (!sawAnything && field.isEmpty() && current.isEmpty()) {
                    return null;
                }
                current.add(field.toString());
                rowNumber++;
                return trimTrailingBlanks(current);
            }

            char c = (char) ch;
            sawAnything = true;

            if (inQuotes) {
                if (c == '"') {
                    int peek = read();
                    if (peek == '"') {
                        // A doubled quote inside a quoted field is one literal quote.
                        field.append('"');
                    } else {
                        inQuotes = false;
                        pushback = peek;
                    }
                } else {
                    field.append(c);
                }
                continue;
            }

            if (c == '"' && field.isEmpty()) {
                inQuotes = true;
            } else if (c == delimiter) {
                current.add(field.toString());
                field.setLength(0);
            } else if (c == '\n' || c == '\r') {
                if (c == '\r') {
                    int peek = read();
                    if (peek != '\n') {
                        pushback = peek;
                    }
                }
                current.add(field.toString());
                rowNumber++;
                return trimTrailingBlanks(current);
            } else {
                field.append(c);
            }
        }
    }

    private int read() throws IOException {
        if (pushback != -1) {
            int c = pushback;
            pushback = -1;
            return c;
        }
        int c = reader.read();
        // Excel prefixes UTF-8 CSV with a byte-order mark; left in place it becomes part of the
        // first header and nothing maps.
        if (c == '﻿' && rowNumber == 0 && current.isEmpty()) {
            return reader.read();
        }
        return c;
    }

    /**
     * Drops cells past the last one with content. A spreadsheet saved with a few stray empty
     * columns would otherwise look like it has more columns than headers.
     */
    private static List<String> trimTrailingBlanks(List<String> row) {
        int last = row.size() - 1;
        while (last >= 0 && (row.get(last) == null || row.get(last).isBlank())) {
            last--;
        }
        return new ArrayList<>(row.subList(0, last + 1));
    }

    @Override
    public int rowNumber() {
        return rowNumber;
    }

    @Override
    public void close() throws IOException {
        reader.close();
    }
}
