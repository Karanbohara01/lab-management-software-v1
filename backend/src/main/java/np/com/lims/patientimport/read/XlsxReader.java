package np.com.lims.patientimport.read;

import np.com.lims.common.exception.ApiException;
import np.com.lims.common.exception.ErrorCode;

import javax.xml.stream.XMLInputFactory;
import javax.xml.stream.XMLStreamConstants;
import javax.xml.stream.XMLStreamException;
import javax.xml.stream.XMLStreamReader;
import java.io.BufferedInputStream;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;

/**
 * A streaming reader for .xlsx workbooks, built on the JDK's own ZIP and StAX parsers.
 *
 * <p>An .xlsx file is a ZIP of XML. The worksheet is read as an event stream, one row at a time, so
 * a 500,000-row workbook costs the memory of a single row rather than the whole book. That is the
 * reason for doing it this way rather than adding a spreadsheet library: the convenient APIs load
 * the workbook, and this file is the one place in the system where that would not fit.
 *
 * <p>Three small parts of the format have to be handled or the data comes out wrong:
 * <ul>
 *   <li><b>Shared strings.</b> Text cells usually hold an index into {@code xl/sharedStrings.xml}
 *       rather than the text itself. That table is read first. Rich text (a cell with mixed
 *       formatting) arrives as several {@code <r><t>} runs which are concatenated.</li>
 *   <li><b>Dates.</b> Excel stores a date as a number and marks it a date through its cell style.
 *       Without reading {@code xl/styles.xml} a date of birth would import as "32964". Serial
 *       numbers are converted on the 1900 epoch, allowing for the non-existent 29 February 1900
 *       that the format deliberately includes.</li>
 *   <li><b>Gaps.</b> Empty cells are simply absent from the XML, so each cell's column is taken
 *       from its own reference ("C7" is column 2) rather than from its position in the row.
 *       Without that, a blank middle column would shift every later value one field to the left.</li>
 * </ul>
 *
 * <p>The older binary .xls format is not a ZIP of XML and is not supported; callers reject it with
 * a message telling the administrator to save as .xlsx or CSV.
 */
public class XlsxReader implements TabularReader {

    /** Built-in number formats that mean "this is a date", per the OOXML spec's fixed table. */
    private static final Set<Integer> BUILT_IN_DATE_FORMATS =
            Set.of(14, 15, 16, 17, 18, 19, 20, 21, 22, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 45, 46, 47, 50,
                    51, 52, 53, 54, 55, 56, 57, 58);

    /** Excel's day 0. Serial 1 is 1 January 1900, so the epoch sits one day earlier. */
    private static final LocalDate EXCEL_EPOCH = LocalDate.of(1899, 12, 31);

    private final ZipFile zip;
    private final XMLStreamReader sheet;
    private final List<String> sharedStrings;
    private final boolean[] styleIsDate;
    private final String sheetName;
    private final List<String> current = new ArrayList<>();
    private int rowNumber;

    public XlsxReader(Path file) throws IOException, XMLStreamException {
        this.zip = openZip(file);
        this.sharedStrings = readSharedStrings(zip);
        this.styleIsDate = readDateStyles(zip);

        ZipEntry sheetEntry = firstWorksheet(zip);
        this.sheetName = sheetEntry.getName().substring(sheetEntry.getName().lastIndexOf('/') + 1).replace(".xml", "");
        XMLInputFactory factory = secureFactory();
        this.sheet = factory.createXMLStreamReader(new BufferedInputStream(zip.getInputStream(sheetEntry), 64 * 1024),
                StandardCharsets.UTF_8.name());
    }

    private static ZipFile openZip(Path file) throws IOException {
        try {
            return new ZipFile(file.toFile());
        } catch (IOException e) {
            // A .xls renamed to .xlsx, or a corrupt upload, both land here.
            throw new ApiException(ErrorCode.VALIDATION_FAILED,
                    "This file could not be read as an Excel workbook. If it was saved in the older .xls format, "
                            + "open it in Excel and use Save As to choose .xlsx or CSV.");
        }
    }

    /**
     * XML parsing of an uploaded file is an untrusted-input path: external entities and DTDs are
     * refused so a crafted workbook cannot read server files or expand into a denial of service.
     */
    private static XMLInputFactory secureFactory() {
        XMLInputFactory factory = XMLInputFactory.newInstance();
        factory.setProperty(XMLInputFactory.IS_SUPPORTING_EXTERNAL_ENTITIES, Boolean.FALSE);
        factory.setProperty(XMLInputFactory.SUPPORT_DTD, Boolean.FALSE);
        return factory;
    }

    private static ZipEntry firstWorksheet(ZipFile zip) {
        // Sheets are named sheet1.xml, sheet2.xml …; the first by number is the one Excel opens on.
        return zip.stream()
                .filter(e -> e.getName().startsWith("xl/worksheets/sheet") && e.getName().endsWith(".xml"))
                .min((a, b) -> Integer.compare(sheetIndex(a.getName()), sheetIndex(b.getName())))
                .orElseThrow(() -> new ApiException(ErrorCode.VALIDATION_FAILED,
                        "This workbook has no worksheets."));
    }

    private static int sheetIndex(String name) {
        String digits = name.replaceAll("\\D+", "");
        return digits.isEmpty() ? Integer.MAX_VALUE : Integer.parseInt(digits);
    }

    /**
     * The workbook's string table. Held in memory because every text cell points into it — it is
     * the one part of an .xlsx that cannot be streamed past. Its size is the number of DISTINCT
     * strings, so a patient list of 500,000 rows with repeated districts and genders produces a
     * table far smaller than the row count.
     */
    private static List<String> readSharedStrings(ZipFile zip) throws IOException, XMLStreamException {
        ZipEntry entry = zip.getEntry("xl/sharedStrings.xml");
        List<String> strings = new ArrayList<>();
        if (entry == null) {
            return strings;
        }
        try (InputStream in = new BufferedInputStream(zip.getInputStream(entry), 64 * 1024)) {
            XMLStreamReader xml = secureFactory().createXMLStreamReader(in, StandardCharsets.UTF_8.name());
            StringBuilder item = null;
            while (xml.hasNext()) {
                int event = xml.next();
                if (event == XMLStreamConstants.START_ELEMENT) {
                    if ("si".equals(xml.getLocalName())) {
                        item = new StringBuilder();
                    }
                } else if (event == XMLStreamConstants.CHARACTERS && item != null) {
                    item.append(xml.getText());
                } else if (event == XMLStreamConstants.END_ELEMENT && "si".equals(xml.getLocalName())) {
                    strings.add(item == null ? "" : item.toString());
                    item = null;
                }
            }
            xml.close();
        }
        return strings;
    }

    /**
     * Which cell styles mean "date". Indexed by the style id a cell carries in its {@code s}
     * attribute; a numeric cell wearing one of these is a date, not a number.
     */
    private static boolean[] readDateStyles(ZipFile zip) throws IOException, XMLStreamException {
        ZipEntry entry = zip.getEntry("xl/styles.xml");
        if (entry == null) {
            return new boolean[0];
        }
        Set<Integer> customDateFormats = new HashSet<>();
        List<Integer> cellFormatIds = new ArrayList<>();

        try (InputStream in = new BufferedInputStream(zip.getInputStream(entry), 32 * 1024)) {
            XMLStreamReader xml = secureFactory().createXMLStreamReader(in, StandardCharsets.UTF_8.name());
            boolean inCellXfs = false;
            while (xml.hasNext()) {
                int event = xml.next();
                if (event == XMLStreamConstants.START_ELEMENT) {
                    String name = xml.getLocalName();
                    if ("numFmt".equals(name)) {
                        String code = xml.getAttributeValue(null, "formatCode");
                        String id = xml.getAttributeValue(null, "numFmtId");
                        if (code != null && id != null && looksLikeDateFormat(code)) {
                            customDateFormats.add(Integer.parseInt(id));
                        }
                    } else if ("cellXfs".equals(name)) {
                        inCellXfs = true;
                    } else if (inCellXfs && "xf".equals(name)) {
                        String id = xml.getAttributeValue(null, "numFmtId");
                        cellFormatIds.add(id == null ? 0 : Integer.parseInt(id));
                    }
                } else if (event == XMLStreamConstants.END_ELEMENT && "cellXfs".equals(xml.getLocalName())) {
                    inCellXfs = false;
                }
            }
            xml.close();
        }

        boolean[] isDate = new boolean[cellFormatIds.size()];
        for (int i = 0; i < cellFormatIds.size(); i++) {
            int fmt = cellFormatIds.get(i);
            isDate[i] = BUILT_IN_DATE_FORMATS.contains(fmt) || customDateFormats.contains(fmt);
        }
        return isDate;
    }

    /**
     * Whether a custom format code describes a date. Day, month and year tokens mean yes; the
     * literal text inside quotes and the colour and condition tokens in square brackets are
     * stripped first so a currency format like {@code "Rs"#,##0} is not mistaken for one.
     */
    static boolean looksLikeDateFormat(String formatCode) {
        String stripped = formatCode.replaceAll("\"[^\"]*\"", "").replaceAll("\\[[^\\]]*\\]", "");
        return stripped.matches(".*[yYdD].*") || stripped.contains("mmm")
                || stripped.matches(".*[hH]:?mm.*");
    }

    @Override
    public List<String> next() throws XMLStreamException {
        current.clear();
        boolean inRow = false;
        String cellRef = null;
        String cellType = null;
        int styleIndex = -1;
        StringBuilder value = null;
        boolean inInlineText = false;

        while (sheet.hasNext()) {
            int event = sheet.next();

            if (event == XMLStreamConstants.START_ELEMENT) {
                switch (sheet.getLocalName()) {
                    case "row" -> {
                        inRow = true;
                        String r = sheet.getAttributeValue(null, "r");
                        // Trust the row's own number: a sheet can skip entirely empty rows, and
                        // counting them ourselves would misreport which line an error is on.
                        rowNumber = r == null ? rowNumber + 1 : Integer.parseInt(r);
                    }
                    case "c" -> {
                        if (!inRow) {
                            break;
                        }
                        cellRef = sheet.getAttributeValue(null, "r");
                        cellType = sheet.getAttributeValue(null, "t");
                        String s = sheet.getAttributeValue(null, "s");
                        styleIndex = s == null ? -1 : Integer.parseInt(s);
                        value = new StringBuilder();
                        inInlineText = false;
                    }
                    case "is" -> inInlineText = true;
                    default -> {
                        // v, t and the rich-text runs all contribute characters; nothing to do here.
                    }
                }
            } else if (event == XMLStreamConstants.CHARACTERS && value != null) {
                value.append(sheet.getText());
            } else if (event == XMLStreamConstants.END_ELEMENT) {
                switch (sheet.getLocalName()) {
                    case "c" -> {
                        if (inRow && value != null) {
                            put(columnOf(cellRef), render(value.toString(), cellType, styleIndex, inInlineText));
                        }
                        value = null;
                    }
                    case "is" -> inInlineText = false;
                    case "row" -> {
                        if (inRow) {
                            return trimTrailingBlanks(current);
                        }
                    }
                    default -> {
                        // nothing
                    }
                }
            }
        }
        return null;
    }

    /** Places a value at its own column, padding any columns the file skipped because they were empty. */
    private void put(int column, String value) {
        if (column < 0) {
            current.add(value);
            return;
        }
        while (current.size() <= column) {
            current.add("");
        }
        current.set(column, value);
    }

    /** "AB12" -> 27. Letters are base-26 with no zero, so AA follows Z. */
    static int columnOf(String cellRef) {
        if (cellRef == null || cellRef.isEmpty()) {
            return -1;
        }
        int column = 0;
        for (int i = 0; i < cellRef.length(); i++) {
            char c = Character.toUpperCase(cellRef.charAt(i));
            if (c < 'A' || c > 'Z') {
                break;
            }
            column = column * 26 + (c - 'A' + 1);
        }
        return column - 1;
    }

    private String render(String raw, String type, int styleIndex, boolean inlineText) {
        if (raw.isEmpty()) {
            return "";
        }
        if ("s".equals(type)) {
            int index = Integer.parseInt(raw.trim());
            return index >= 0 && index < sharedStrings.size() ? sharedStrings.get(index) : "";
        }
        if ("inlineStr".equals(type) || inlineText || "str".equals(type)) {
            return raw;
        }
        if ("b".equals(type)) {
            return "1".equals(raw.trim()) ? "TRUE" : "FALSE";
        }
        if ("e".equals(type)) {
            // An Excel error cell (#N/A, #REF!) — surface the text so validation can reject it.
            return raw;
        }
        if (styleIndex >= 0 && styleIndex < styleIsDate.length && styleIsDate[styleIndex]) {
            String asDate = toDate(raw);
            if (asDate != null) {
                return asDate;
            }
        }
        return stripTrailingZeros(raw);
    }

    /**
     * Excel's day count to an ISO date. The format pretends 1900 was a leap year for compatibility
     * with a forty-year-old bug, so every serial after 28 February 1900 is one too high and has to
     * be shifted back.
     */
    public static String toDate(String raw) {
        try {
            double serial = Double.parseDouble(raw.trim());
            if (serial < 1 || serial > 2_958_465) {
                return null;
            }
            long days = (long) Math.floor(serial);
            if (days > 59) {
                days -= 1;
            }
            LocalDate date = EXCEL_EPOCH.plusDays(days);
            double fraction = serial - Math.floor(serial);
            if (fraction > 0.000001) {
                long secondsOfDay = Math.round(fraction * 86_400d);
                return LocalDateTime.of(date, java.time.LocalTime.ofSecondOfDay(Math.min(secondsOfDay, 86_399)))
                        .toLocalDate().toString();
            }
            return date.toString();
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /** 9801234567.0 -> 9801234567, so a phone number stored as a number does not gain a decimal point. */
    static String stripTrailingZeros(String raw) {
        String trimmed = raw.trim();
        if (trimmed.isEmpty() || trimmed.indexOf('.') < 0) {
            return trimmed;
        }
        try {
            return new BigDecimal(trimmed).stripTrailingZeros().toPlainString();
        } catch (NumberFormatException e) {
            return trimmed;
        }
    }

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
    public String sheetName() {
        return sheetName;
    }

    @Override
    public void close() throws IOException {
        try {
            sheet.close();
        } catch (XMLStreamException e) {
            // Nothing useful to do while closing.
        }
        zip.close();
    }

    /** Convenience for callers that only have a stream; the ZIP reader needs a real file. */
    public static XlsxReader open(Path file) throws IOException, XMLStreamException {
        return new XlsxReader(file);
    }

    /** True when the first bytes are a ZIP header, which every .xlsx is and no .xls is. */
    public static boolean looksLikeXlsx(Path file) {
        try (InputStream in = new FileInputStream(file.toFile())) {
            byte[] magic = in.readNBytes(2);
            return magic.length == 2 && magic[0] == 'P' && magic[1] == 'K';
        } catch (IOException e) {
            return false;
        }
    }
}
