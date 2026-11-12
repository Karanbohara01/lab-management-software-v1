package np.com.lims.patientimport;

import np.com.lims.patientimport.dto.ImportDtos.RowView;
import np.com.lims.patientimport.entity.ImportRowStatus;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * The template a clinic downloads, and the reports it downloads afterwards.
 *
 * <p>CSV, written here rather than through a spreadsheet library. It is the one format Excel, Google
 * Sheets and every clinic's old software all open, and generating it costs nothing. A UTF-8
 * byte-order mark is written first: without it Excel on Windows opens a UTF-8 file as the local
 * code page and Nepali names turn to mojibake, which is the single most likely way this feature
 * could appear broken.
 */
public final class ImportCsvWriter {

    /** Excel reads a UTF-8 CSV correctly only when it begins with this. */
    private static final String BOM = "﻿";

    private ImportCsvWriter() {
    }

    /**
     * The import template: a header row of every supported field, a row explaining each one, and
     * two example patients.
     *
     * <p>The instructions ride in the file itself rather than in a separate document, because the
     * file is what gets emailed around a clinic. They sit in rows beneath the header, which an
     * administrator deletes along with the examples before filling it in — the import skips any row
     * that has no name anyway.
     */
    public static String template() {
        List<ImportField> fields = List.of(ImportField.values());
        StringBuilder out = new StringBuilder(BOM);

        appendRow(out, fields.stream()
                .map(f -> f.mandatory() ? f.label() + " *" : f.label())
                .toList());
        appendRow(out, fields.stream().map(ImportField::instruction).toList());
        appendRow(out, fields.stream().map(ImportField::example).toList());
        appendRow(out, exampleRow(fields));

        out.append("\r\n");
        appendRow(out, List.of("HOW TO USE THIS TEMPLATE"));
        appendRow(out, List.of("1. Columns marked * are required. Every patient needs a name, a gender, "
                + "and either a date of birth or an age."));
        appendRow(out, List.of("2. Delete these instruction rows and the two example patients, then paste "
                + "your own records under the header row."));
        appendRow(out, List.of("3. You do not have to use this layout. You can upload your own spreadsheet "
                + "and match up the columns on screen."));
        appendRow(out, List.of("4. Keep phone numbers and patient IDs as text in Excel, so leading zeros "
                + "are not lost."));
        appendRow(out, List.of("5. Your clinic's existing patient ID is kept on the record for reference. "
                + "Each patient is also given a new number by this system."));
        appendRow(out, List.of("6. Dates can be written as 1990-04-15, 15/04/1990 or 15-Apr-1990."));
        appendRow(out, List.of("7. Nepali text is supported in any column."));
        return out.toString();
    }

    private static List<String> exampleRow(List<ImportField> fields) {
        Map<ImportField, String> second = Map.ofEntries(
                Map.entry(ImportField.FULL_NAME, "Hari Bahadur Thapa"),
                Map.entry(ImportField.NAME_LOCAL, "हरि बहादुर थापा"),
                Map.entry(ImportField.SALUTATION, "Mr"),
                Map.entry(ImportField.GENDER, "Male"),
                Map.entry(ImportField.AGE_YEARS, "52"),
                Map.entry(ImportField.PHONE, "9841234567"),
                Map.entry(ImportField.EXTERNAL_ID, "OLD-10235"),
                Map.entry(ImportField.BLOOD_GROUP, "B+"),
                Map.entry(ImportField.ADDRESS_LINE, "Lakeside, Ward 6"),
                Map.entry(ImportField.ADDRESS_CITY, "Pokhara"),
                Map.entry(ImportField.ADDRESS_DISTRICT, "Kaski"),
                Map.entry(ImportField.CATEGORY, "OPD referral"),
                Map.entry(ImportField.NOTES, "Diabetic, reviewed yearly"));
        List<String> row = new ArrayList<>();
        for (ImportField f : fields) {
            row.add(second.getOrDefault(f, ""));
        }
        return row;
    }

    /**
     * A report of one kind of outcome. Every row keeps its original line number and the data as it
     * was uploaded, so the administrator can correct the file and import it again.
     */
    public static String report(List<RowView> rows, boolean includeReason) {
        StringBuilder out = new StringBuilder(BOM);
        List<ImportField> fields = List.of(ImportField.values());

        List<String> header = new ArrayList<>();
        header.add("Row");
        header.add("Outcome");
        if (includeReason) {
            header.add("Problem");
            header.add("Column at fault");
        }
        header.add("Existing patient");
        header.add("New patient number");
        fields.forEach(f -> header.add(f.label()));
        appendRow(out, header);

        for (RowView row : rows) {
            List<String> cells = new ArrayList<>();
            cells.add(String.valueOf(row.rowNumber()));
            cells.add(outcomeOf(row.status()));
            if (includeReason) {
                cells.add(problemOf(row));
                cells.add(labelOf(row.errorField()));
            }
            cells.add(existingOf(row));
            cells.add(row.patientId() == null ? "" : String.valueOf(row.patientId()));
            for (ImportField f : fields) {
                cells.add(row.data().getOrDefault(f.name(), ""));
            }
            appendRow(out, cells);
        }
        return out.toString();
    }

    private static String outcomeOf(ImportRowStatus status) {
        return switch (status) {
            case IMPORTED -> "Imported";
            case UPDATED -> "Existing patient updated";
            case INVALID -> "Not imported — has an error";
            case FAILED -> "Not imported — could not be saved";
            case DUPLICATE -> "Matches an existing patient";
            case DUPLICATE_IN_FILE -> "Repeats an earlier row in this file";
            case POSSIBLE_DUPLICATE -> "Possibly an existing patient (same name, gender and age)";
            case SKIPPED -> "Skipped";
            case VALID -> "Ready to import";
            case PENDING -> "Not yet checked";
        };
    }

    private static String problemOf(RowView row) {
        if (row.errorMessage() != null) {
            return row.errorMessage();
        }
        return row.duplicateReason() == null ? "" : row.duplicateReason();
    }

    private static String existingOf(RowView row) {
        if (row.duplicateOfMrn() != null) {
            return row.duplicateOfMrn();
        }
        return row.duplicateOfRow() == null ? "" : "row " + row.duplicateOfRow();
    }

    private static String labelOf(String fieldName) {
        if (fieldName == null) {
            return "";
        }
        try {
            return ImportField.valueOf(fieldName).label();
        } catch (IllegalArgumentException e) {
            return fieldName;
        }
    }

    private static void appendRow(StringBuilder out, List<String> cells) {
        for (int i = 0; i < cells.size(); i++) {
            if (i > 0) {
                out.append(',');
            }
            out.append(escape(cells.get(i)));
        }
        out.append("\r\n");
    }

    /**
     * Quotes a cell where CSV requires it. A leading {@code =}, {@code +}, {@code -} or {@code @} is
     * also prefixed with an apostrophe: Excel would otherwise treat the cell as a formula, which is
     * both wrong and the classic way a spreadsheet download becomes an attack on whoever opens it.
     */
    private static String escape(String value) {
        if (value == null || value.isEmpty()) {
            return "";
        }
        String safe = value;
        char first = safe.charAt(0);
        if (first == '=' || first == '+' || first == '-' || first == '@' || first == '\t' || first == '\r') {
            safe = "'" + safe;
        }
        if (safe.indexOf('"') >= 0 || safe.indexOf(',') >= 0 || safe.indexOf('\n') >= 0 || safe.indexOf('\r') >= 0) {
            return '"' + safe.replace("\"", "\"\"") + '"';
        }
        return safe;
    }
}
