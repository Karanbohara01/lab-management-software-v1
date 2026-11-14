package np.com.lims.catalog;

import np.com.lims.catalog.entity.LabTest;

import java.util.List;

/**
 * Builds the CSV for the lab catalog's export and blank import template. Kept separate from
 * {@code np.com.lims.patientimport.ImportCsvWriter} even though the safety properties are
 * identical (BOM, CRLF rows, formula-injection escaping) — the two write entirely different row
 * shapes and have no other reason to share code.
 *
 * <p>Column order here is the single source of truth for both this writer and
 * {@link TestCatalogImportService}'s reader — matched exactly so "export, edit in a spreadsheet,
 * re-import" round-trips without the user reordering anything. Only {@code code}/{@code name}/
 * {@code department}/{@code price} are mandatory on import; the rest default sensibly on a blank
 * cell. There is deliberately no {@code type} column — CSV import only ever creates/updates
 * ANALYTE tests (see {@code TestCatalogImportService}'s class doc).
 */
public final class TestCatalogCsvWriter {

    private static final String BOM = "﻿";

    static final List<String> HEADER = List.of(
            "code", "name", "department", "category", "resultMode", "specimenType",
            "specimenRequirements", "method", "loincCode", "price", "turnaroundHours",
            "containerType", "minVolumeMl", "stabilityNote", "fastingRequired", "fastingHours",
            "referral", "referralLab", "autoVerifyEnabled", "active"
    );

    private TestCatalogCsvWriter() {
    }

    public static String export(List<LabTest> tests) {
        StringBuilder out = new StringBuilder(BOM);
        appendRow(out, HEADER);
        for (LabTest t : tests) {
            appendRow(out, List.of(
                    blank(t.getCode()),
                    blank(t.getName()),
                    blank(t.getDepartment() == null ? null : t.getDepartment().getName()),
                    blank(t.getCategory()),
                    t.getResultMode().name(),
                    t.getSpecimenType().name(),
                    blank(t.getSpecimenRequirements()),
                    blank(t.getMethod()),
                    blank(t.getLoincCode()),
                    t.getPrice() == null ? "" : t.getPrice().toPlainString(),
                    t.getTurnaroundHours() == null ? "" : t.getTurnaroundHours().toString(),
                    blank(t.getContainerType()),
                    t.getMinVolumeMl() == null ? "" : t.getMinVolumeMl().toPlainString(),
                    blank(t.getStabilityNote()),
                    String.valueOf(t.isFastingRequired()),
                    t.getFastingHours() == null ? "" : t.getFastingHours().toString(),
                    String.valueOf(t.isReferral()),
                    blank(t.getReferralLab()),
                    String.valueOf(t.isAutoVerifyEnabled()),
                    String.valueOf(t.isActive())
            ));
        }
        return out.toString();
    }

    /** A blank catalog with the header, two worked examples, and usage notes — the same shape as
     * {@code ImportCsvWriter.template()}, scaled down to this catalog's much shorter column list. */
    public static String template() {
        StringBuilder out = new StringBuilder(BOM);
        appendRow(out, HEADER);
        appendRow(out, List.of("CBC", "Complete Blood Count", "Haematology", "", "PARAMETRIC",
                "BLOOD_EDTA", "", "Automated 5-part analyser", "", "450", "4", "Lavender EDTA", "2",
                "24h at 2-8C", "false", "", "false", "", "true", "true"));
        appendRow(out, List.of("TSH", "Thyroid Stimulating Hormone", "Endocrinology", "", "PARAMETRIC",
                "BLOOD_SERUM", "", "", "", "600", "24", "", "", "", "false", "", "false", "", "false", "true"));
        appendRow(out, List.of());
        appendRow(out, List.of("HOW TO USE THIS TEMPLATE"));
        appendRow(out, List.of("1. code, name, department and price are required. Everything else can be left blank."));
        appendRow(out, List.of("2. An unknown department name is created automatically."));
        appendRow(out, List.of("3. resultMode: PARAMETRIC or CULTURE. specimenType: BLOOD_EDTA, BLOOD_SERUM, "
                + "BLOOD_CITRATE, BLOOD_FLUORIDE, BLOOD_HEPARIN, WHOLE_BLOOD, URINE, STOOL, SPUTUM, SWAB, CSF, "
                + "BODY_FLUID, TISSUE or OTHER."));
        appendRow(out, List.of("4. fastingRequired, referral, autoVerifyEnabled and active accept true/false "
                + "(or yes/no, 1/0)."));
        appendRow(out, List.of("5. Re-uploading a code that already exists updates that test's price, "
                + "specimen handling and the other columns here — it never touches its parameters/reference "
                + "ranges, which stay exactly as configured on the test's own page."));
        appendRow(out, List.of("6. Profile/panel tests aren't supported via CSV yet — add those from the "
                + "New Test screen."));
        return out.toString();
    }

    private static String blank(String v) {
        return v == null ? "" : v;
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
