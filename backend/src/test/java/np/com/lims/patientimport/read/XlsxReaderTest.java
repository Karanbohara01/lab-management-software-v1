package np.com.lims.patientimport.read;

import np.com.lims.common.exception.ApiException;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Reads workbooks written by a real Excel writer, not by this code, so the test proves the reader
 * handles the format as Excel actually produces it — shared strings, date styles, absent cells and
 * columns past Z — rather than only round-tripping its own assumptions.
 */
class XlsxReaderTest {

    private static Path fixture(String name) {
        return Paths.get("src", "test", "resources", "patient-import", name);
    }

    private static List<List<String>> readAll(String name) throws Exception {
        List<List<String>> rows = new ArrayList<>();
        try (XlsxReader reader = XlsxReader.open(fixture(name))) {
            List<String> row;
            while ((row = reader.next()) != null) {
                rows.add(List.copyOf(row));
            }
        }
        return rows;
    }

    @Test
    void readsHeadersAndRowsFromARealWorkbook() throws Exception {
        List<List<String>> rows = readAll("patients-mixed.xlsx");
        assertThat(rows.get(0)).startsWith("Patient Name", "Sex", "DOB", "Mobile");
        assertThat(rows.get(1)).startsWith("Sita Rai", "F");
    }

    @Test
    void turnsADateCellIntoAnIsoDateRatherThanItsSerialNumber() throws Exception {
        // Without reading the cell styles this would come out as "32978".
        assertThat(readAll("patients-mixed.xlsx").get(1).get(2)).isEqualTo("1990-04-15");
    }

    @Test
    void readsADateTimeCellAsItsDate() throws Exception {
        List<List<String>> rows = readAll("patients-mixed.xlsx");
        List<String> timed = rows.stream().filter(r -> !r.isEmpty() && r.get(0).equals("Timed Patient"))
                .findFirst().orElseThrow();
        assertThat(timed.get(2)).isEqualTo("1995-07-07");
    }

    @Test
    void doesNotGiveANumericPhoneADecimalPoint() throws Exception {
        // Excel stores it as a double; rendered naively it becomes "1.456789E7" or "14567890.0".
        assertThat(readAll("patients-mixed.xlsx").get(2).get(3)).isEqualTo("14567890");
    }

    @Test
    void keepsNepaliText() throws Exception {
        List<String> row = readAll("patients-mixed.xlsx").get(3);
        assertThat(row.get(0)).isEqualTo("सीता राई");
        assertThat(row.get(1)).isEqualTo("महिला");
        assertThat(row.get(6)).isEqualTo("काठमाडौं");
    }

    @Test
    void anAbsentCellLeavesItsColumnEmptyInsteadOfShiftingTheRest() throws Exception {
        // The gap row has no date, phone or address; "OLD-4" must still land in column 5.
        List<String> row = readAll("patients-mixed.xlsx").get(4);
        assertThat(row.get(0)).isEqualTo("Gap Patient");
        assertThat(row.get(2)).isEmpty();
        assertThat(row.get(3)).isEmpty();
        assertThat(row.get(5)).isEqualTo("OLD-4");
    }

    @Test
    void readsColumnsBeyondZ() throws Exception {
        // AB is the 28th column; decoding the letters as base-26 is what gets it there.
        List<String> row = readAll("patients-mixed.xlsx").get(5);
        assertThat(row).hasSizeGreaterThanOrEqualTo(28);
        assertThat(row.get(27)).isEqualTo("AB-column-value");
    }

    @Test
    void reportsTheLineNumberExcelShowsEvenAcrossABlankRow() throws Exception {
        try (XlsxReader reader = XlsxReader.open(fixture("patients-gaps.xlsx"))) {
            reader.next();
            assertThat(reader.rowNumber()).isEqualTo(1);
            reader.next();
            assertThat(reader.rowNumber()).isEqualTo(2);
            List<String> next = reader.next();
            // The blank row may be present or skipped by the writer; either way the row AFTER it
            // must report line 4, so an error points at the line the administrator sees.
            if (next != null && next.stream().allMatch(c -> c == null || c.isBlank())) {
                next = reader.next();
            }
            assertThat(reader.rowNumber()).isEqualTo(4);
            assertThat(next).contains("Fourth");
        }
    }

    @Test
    void aHeaderOnlySheetYieldsJustTheHeader() throws Exception {
        assertThat(readAll("patients-headeronly.xlsx")).hasSize(1);
    }

    @Test
    void readsAFiveThousandRowWorkbookWithoutHoldingItInMemory() throws Exception {
        long before = usedMemory();
        int count = 0;
        try (XlsxReader reader = XlsxReader.open(fixture("patients-5000.xlsx"))) {
            while (reader.next() != null) {
                count++;
            }
        }
        assertThat(count).isEqualTo(5001);
        // The reader keeps one row plus the shared-string table; it must not grow with the sheet.
        assertThat(usedMemory() - before).isLessThan(96L * 1024 * 1024);
    }

    private static long usedMemory() {
        System.gc();
        Runtime runtime = Runtime.getRuntime();
        return runtime.totalMemory() - runtime.freeMemory();
    }

    @Test
    void refusesAFileThatIsNotAWorkbookWithAnActionableMessage() throws IOException {
        Path fake = Files.createTempFile("not-a-workbook", ".xlsx");
        Files.writeString(fake, "this is not a zip", StandardCharsets.UTF_8);
        try {
            assertThat(XlsxReader.looksLikeXlsx(fake)).isFalse();
            assertThatThrownBy(() -> XlsxReader.open(fake))
                    .isInstanceOf(ApiException.class)
                    .hasMessageContaining(".xlsx");
        } finally {
            Files.deleteIfExists(fake);
        }
    }

    @Test
    void recognisesAWorkbookByItsZipHeader() {
        assertThat(XlsxReader.looksLikeXlsx(fixture("patients-mixed.xlsx"))).isTrue();
    }

    @Test
    void decodesColumnLetters() {
        assertThat(XlsxReader.columnOf("A1")).isZero();
        assertThat(XlsxReader.columnOf("C7")).isEqualTo(2);
        assertThat(XlsxReader.columnOf("Z1")).isEqualTo(25);
        assertThat(XlsxReader.columnOf("AA1")).isEqualTo(26);
        assertThat(XlsxReader.columnOf("AB1")).isEqualTo(27);
        assertThat(XlsxReader.columnOf("BA1")).isEqualTo(52);
    }

    @Test
    void convertsExcelSerialNumbersAllowingForTheFakeLeapDay() {
        // Excel pretends 29 February 1900 existed, so every serial after it is one too high.
        assertThat(XlsxReader.toDate("1")).isEqualTo("1900-01-01");
        assertThat(XlsxReader.toDate("59")).isEqualTo("1900-02-28");
        assertThat(XlsxReader.toDate("61")).isEqualTo("1900-03-01");
        assertThat(XlsxReader.toDate("32978")).isEqualTo("1990-04-15");
        assertThat(XlsxReader.toDate("45000")).isEqualTo("2023-03-15");
        assertThat(XlsxReader.toDate("not a number")).isNull();
    }

    @Test
    void tellsADateFormatFromACurrencyOne() {
        assertThat(XlsxReader.looksLikeDateFormat("dd/mm/yyyy")).isTrue();
        assertThat(XlsxReader.looksLikeDateFormat("yyyy-mm-dd")).isTrue();
        assertThat(XlsxReader.looksLikeDateFormat("d-mmm-yy")).isTrue();
        assertThat(XlsxReader.looksLikeDateFormat("#,##0.00")).isFalse();
        assertThat(XlsxReader.looksLikeDateFormat("\"Rs\"#,##0")).isFalse();
    }
}
