package np.com.lims.patientimport.read;

import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class CsvReaderTest {

    private static List<List<String>> readAll(String csv) throws Exception {
        List<List<String>> rows = new ArrayList<>();
        try (CsvReader reader = new CsvReader(new ByteArrayInputStream(csv.getBytes(StandardCharsets.UTF_8)))) {
            List<String> row;
            while ((row = reader.next()) != null) {
                rows.add(List.copyOf(row));
            }
        }
        return rows;
    }

    @Test
    void readsAPlainFile() throws Exception {
        assertThat(readAll("Name,Phone\nSita Rai,9801234567\nHari Thapa,9841234567\n"))
                .containsExactly(
                        List.of("Name", "Phone"),
                        List.of("Sita Rai", "9801234567"),
                        List.of("Hari Thapa", "9841234567"));
    }

    @Test
    void handlesQuotedFieldsContainingTheDelimiterAndNewlines() throws Exception {
        List<List<String>> rows = readAll("Name,Address\n\"Rai, Sita\",\"Shantinagar\nWard 10\"\n");
        assertThat(rows).hasSize(2);
        assertThat(rows.get(1)).containsExactly("Rai, Sita", "Shantinagar\nWard 10");
    }

    @Test
    void aDoubledQuoteInsideAQuotedFieldIsOneQuote() throws Exception {
        assertThat(readAll("Name\n\"Sita \"\"Didi\"\" Rai\"\n").get(1))
                .containsExactly("Sita \"Didi\" Rai");
    }

    @Test
    void stripsTheByteOrderMarkExcelWrites() throws Exception {
        // Left in place it becomes part of the first header and nothing maps.
        List<List<String>> rows = readAll("﻿Name,Phone\nSita,980\n");
        assertThat(rows.get(0).get(0)).isEqualTo("Name");
    }

    @Test
    void readsAllThreeLineEndings() throws Exception {
        assertThat(readAll("a,b\r\nc,d\rE,f\ng,h")).containsExactly(
                List.of("a", "b"), List.of("c", "d"), List.of("E", "f"), List.of("g", "h"));
    }

    @Test
    void keepsNepaliText() throws Exception {
        assertThat(readAll("Name,Local\nSita Rai,सीता राई\n").get(1))
                .containsExactly("Sita Rai", "सीता राई");
    }

    @Test
    void detectsSemicolonAndTabSeparatedExports() throws Exception {
        // European Excel writes semicolons; "Text (tab delimited)" writes tabs.
        assertThat(readAll("Name;Phone;City\nSita;980;Kathmandu\n").get(1))
                .containsExactly("Sita", "980", "Kathmandu");
        assertThat(readAll("Name\tPhone\tCity\nSita\t980\tKathmandu\n").get(1))
                .containsExactly("Sita", "980", "Kathmandu");
    }

    @Test
    void doesNotSplitOnACommaInsideASemicolonFile() throws Exception {
        assertThat(readAll("Name;Address\nSita;Shantinagar, Ward 10\n").get(1))
                .containsExactly("Sita", "Shantinagar, Ward 10");
    }

    @Test
    void keepsEmptyCellsInTheMiddleSoColumnsDoNotShift() throws Exception {
        assertThat(readAll("a,b,c\n1,,3\n").get(1)).containsExactly("1", "", "3");
    }

    @Test
    void trimsTrailingEmptyCells() throws Exception {
        // A sheet saved with stray empty columns should not look wider than its header.
        assertThat(readAll("a,b\n1,2,,,\n").get(1)).containsExactly("1", "2");
    }

    @Test
    void anEmptyFileYieldsNothing() throws Exception {
        assertThat(readAll("")).isEmpty();
    }

    @Test
    void reportsTheLineNumberAsExcelCountsIt() throws Exception {
        try (CsvReader reader = new CsvReader(
                new ByteArrayInputStream("h\na\nb\n".getBytes(StandardCharsets.UTF_8)))) {
            reader.next();
            assertThat(reader.rowNumber()).isEqualTo(1);
            reader.next();
            assertThat(reader.rowNumber()).isEqualTo(2);
            reader.next();
            assertThat(reader.rowNumber()).isEqualTo(3);
        }
    }

    @Test
    void aFileWithNoTrailingNewlineStillYieldsItsLastRow() throws Exception {
        assertThat(readAll("a,b\n1,2")).hasSize(2);
    }
}
