package np.com.lims.ird.gateway;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import np.com.lims.common.calendar.BikramSambatCalendar;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.io.UncheckedIOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Real gateway to the IRD Central Billing Monitoring System (CBMS), implementing the API
 * described in "Central Billing Monitoring System API Documentation" (updated 2079 Ashoj 28 /
 * 2022-10-14): {@code POST /api/bill} and {@code POST /api/billreturn} (credit notes).
 *
 * <h2>Bikram Sambat dates — verified requirement, now handled</h2>
 * Verified directly against the live CBMS sandbox ({@code cbapi.ird.gov.np}, Test_CBMS
 * credentials) on 2026-09-09: {@code invoice_date} MUST be a Bikram Sambat (BS) date in
 * dot-separated form (e.g. {@code "2082.05.24"}) — the Gregorian date is rejected outright with
 * response code {@code 104} (invalid model). {@code fiscal_year} must also be dot-separated BS
 * (e.g. {@code "2082.083"}); a slash-separated value (e.g. "2082/83", which is what a lab admin
 * might reasonably type into Settings) crashes the CBMS endpoint with an HTTP 500 rather than a
 * clean validation error. Dates are converted via {@link BikramSambatCalendar} (a verified
 * lookup-table conversion, not an algorithmic guess — see its javadoc for provenance);
 * {@code fiscal_year} is re-derived into the dotted format from whatever leading year the lab
 * admin's free-text Settings value starts with, so a stray "/" or "-" there can no longer crash
 * CBMS. A real {@code POST /api/bill} submission through this gateway was accepted (status 200)
 * by the live sandbox on 2026-09-10.
 */
@Configuration
@EnableConfigurationProperties(IrdProperties.class)
public class CbmsIrdGateway {

    private static final Logger log = LoggerFactory.getLogger(CbmsIrdGateway.class);
    private static final ZoneId KATHMANDU = ZoneId.of("Asia/Kathmandu");
    private static final DateTimeFormatter ISO_DATETIME = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss")
            .withZone(KATHMANDU);
    private static final Pattern LEADING_YEAR = Pattern.compile("^(\\d{4})");
    private static final ObjectMapper RESPONSE_MAPPER = new ObjectMapper();

    @Bean
    @ConditionalOnProperty(prefix = "lims.ird", name = "enabled", havingValue = "true")
    public IrdGateway irdGateway(IrdProperties properties, RestClient.Builder restClientBuilder) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(10));
        requestFactory.setReadTimeout(Duration.ofSeconds(20));
        RestClient client = restClientBuilder
                .baseUrl(properties.baseUrl())
                .requestFactory(requestFactory)
                .build();

        return new Impl(properties, client);
    }

    /** Package-private (not an anonymous class) so /api/bill and /api/billreturn can share the request/response plumbing. */
    private static final class Impl implements IrdGateway {

        private final IrdProperties properties;
        private final RestClient client;

        Impl(IrdProperties properties, RestClient client) {
            this.properties = properties;
            this.client = client;
        }

        @Override
        public String environment() {
            return properties.environment() == null || properties.environment().isBlank()
                    ? "LIVE" : properties.environment();
        }

        @Override
        public boolean isConfigured() {
            return properties.isFullyConfigured();
        }

        @Override
        public Result submit(IrdBillPayload payload) {
            if (!properties.isFullyConfigured()) {
                return Result.transportError("IRD_MISCONFIGURED",
                        "lims.ird.enabled is true but base-url/username/password/seller-pan are "
                                + "not all set. No data was transmitted.");
            }

            String bsInvoiceDate;
            try {
                bsInvoiceDate = toBsDotted(payload.issuedAt());
            } catch (IllegalArgumentException ex) {
                return Result.rejected("BS_DATE_OUT_OF_RANGE", ex.getMessage(), null);
            }

            Map<String, Object> body = new LinkedHashMap<>();
            body.put("username", properties.username());
            body.put("password", properties.password());
            // Per the CBMS spec, seller_pan must equal the PAN tied to the Taxpayer Login
            // credentials above — the lab's own PAN on file (payload.sellerPan()) is
            // deliberately NOT used here, since a mismatch is rejected by IRD outright.
            body.put("seller_pan", properties.sellerPan());
            body.put("buyer_pan", nullToBlank(payload.buyerPan()));
            body.put("fiscal_year", normalizeFiscalYear(payload.fiscalYear()));
            body.put("buyer_name", nullToBlank(payload.buyerName()));
            body.put("invoice_number", payload.invoiceNumber());
            body.put("invoice_date", bsInvoiceDate);
            body.put("total_sales", n(payload.totalAmount()));
            body.put("taxable_sales_vat", n(payload.taxableAmount()));
            body.put("vat", n(payload.taxAmount()));
            body.put("excisable_amount", 0);
            body.put("excise", 0);
            body.put("taxable_sales_hst", 0);
            body.put("hst", 0);
            body.put("amount_for_esf", 0);
            body.put("esf", 0);
            body.put("export_sales", 0);
            body.put("tax_exempted_sales", 0);
            body.put("isrealtime", true);
            body.put("datetimeClient", ISO_DATETIME.format(payload.issuedAt()));

            return post("/api/bill", body, payload.invoiceNumber());
        }

        @Override
        public Result submitCreditNote(IrdCreditNotePayload payload) {
            if (!properties.isFullyConfigured()) {
                return Result.transportError("IRD_MISCONFIGURED",
                        "lims.ird.enabled is true but base-url/username/password/seller-pan are "
                                + "not all set. No data was transmitted.");
            }

            String bsCreditNoteDate;
            try {
                bsCreditNoteDate = toBsDotted(payload.creditNoteDate());
            } catch (IllegalArgumentException ex) {
                return Result.rejected("BS_DATE_OUT_OF_RANGE", ex.getMessage(), null);
            }

            Map<String, Object> body = new LinkedHashMap<>();
            body.put("username", properties.username());
            body.put("password", properties.password());
            body.put("seller_pan", properties.sellerPan());
            // Unlike /api/bill (which accepts an empty string), /api/billreturn's buyer_pan is
            // typed as a nullable decimal server-side — an empty string is rejected outright
            // with an HTTP 400 model-binding error (confirmed live). Send JSON null when blank.
            body.put("buyer_pan", org.springframework.util.StringUtils.hasText(payload.buyerPan()) ? payload.buyerPan() : null);
            body.put("fiscal_year", normalizeFiscalYear(payload.fiscalYear()));
            body.put("buyer_name", nullToBlank(payload.buyerName()));
            body.put("ref_invoice_number", payload.refInvoiceNumber());
            body.put("credit_note_number", payload.creditNoteNumber());
            body.put("credit_note_date", bsCreditNoteDate);
            body.put("reason_for_return", payload.reasonForReturn());
            body.put("total_sales", n(payload.totalAmount()));
            body.put("taxable_sales_vat", n(payload.taxableAmount()));
            body.put("vat", n(payload.taxAmount()));
            body.put("excisable_amount", 0);
            body.put("excise", 0);
            body.put("taxable_sales_hst", 0);
            body.put("hst", 0);
            body.put("amount_for_esf", 0);
            body.put("esf", 0);
            body.put("export_sales", 0);
            body.put("tax_exempted_sales", 0);
            body.put("isrealtime", true);
            body.put("datetimeClient", ISO_DATETIME.format(payload.creditNoteDate()));

            return post("/api/billreturn", body, payload.creditNoteNumber());
        }

        private Result post(String uri, Map<String, Object> body, String logRef) {
            String raw;
            try {
                // CBMS replies with a bare status code as the body (e.g. "200") but declares
                // Content-Type: application/octet-stream, which no JSON/String converter accepts
                // by declared type — read the raw bytes ourselves instead of relying on
                // content-type negotiation.
                raw = client.post()
                        .uri(uri)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(body)
                        .exchange((request, response) ->
                                new String(response.getBody().readAllBytes(), StandardCharsets.UTF_8));
            } catch (RestClientException | UncheckedIOException ex) {
                log.warn("CBMS {} call failed for {}: {}", uri, logRef, ex.toString());
                return Result.transportError("CBMS_UNREACHABLE", ex.getMessage());
            }
            return interpret(raw);
        }

        private String toBsDotted(Instant instant) {
            return BikramSambatCalendar.toBs(instant.atZone(KATHMANDU).toLocalDate()).dotted();
        }
    }

    private static IrdGateway.Result interpret(String raw) {
        // The documented sample shows a bare status code as the body (e.g. "200"), but the live
        // sandbox actually wraps it as JSON, e.g. {"message":"104"} — accept either shape rather
        // than trusting the doc's sample literally.
        String code = extractCode(raw);
        return switch (code) {
            case "200" -> IrdGateway.Result.accepted(null, raw);
            case "101" -> IrdGateway.Result.duplicate(null, raw);
            case "100" -> IrdGateway.Result.rejected(code, "API credentials do not match (seller_pan/username/password)", raw);
            case "104" -> IrdGateway.Result.rejected(code, "CBMS rejected the request: invalid model/fields", raw);
            case "102" -> IrdGateway.Result.rejected(code, "CBMS exception while saving details", raw);
            case "103" -> IrdGateway.Result.rejected(code, "CBMS unknown exception — check API URL and fields", raw);
            case "105" -> IrdGateway.Result.rejected(code, "CBMS: referenced bill does not exist (for sales return)", raw);
            default -> IrdGateway.Result.rejected(code.isBlank() ? "EMPTY_RESPONSE" : code,
                    "Unrecognised CBMS response: " + raw, raw);
        };
    }

    private static String extractCode(String raw) {
        if (raw == null) {
            return "";
        }
        String trimmed = raw.trim();
        if (trimmed.startsWith("{")) {
            try {
                Map<?, ?> parsed = RESPONSE_MAPPER.readValue(trimmed, Map.class);
                Object message = parsed.get("message") != null ? parsed.get("message") : parsed.get("Message");
                return message == null ? "" : String.valueOf(message).trim();
            } catch (JsonProcessingException e) {
                return trimmed;
            }
        }
        // Strip surrounding quotes in case the body is a JSON string literal, e.g. "200".
        if (trimmed.length() >= 2 && trimmed.startsWith("\"") && trimmed.endsWith("\"")) {
            trimmed = trimmed.substring(1, trimmed.length() - 1);
        }
        return trimmed;
    }

    /**
     * Re-derives CBMS's required dotted BS fiscal-year form ({@code "2082.083"}, i.e. the
     * starting year, a dot, then the next year's last 3 digits zero-padded) from whatever the
     * lab admin typed into Settings — which may use "/" or "-" (e.g. "2082/83") and would
     * otherwise crash the CBMS endpoint outright (HTTP 500, confirmed live). Falls back to the
     * raw value, unchanged, if it doesn't start with a 4-digit year — better an honest CBMS
     * rejection on a value we can't confidently parse than a silently wrong one.
     */
    private static String normalizeFiscalYear(String rawFiscalYear) {
        if (rawFiscalYear == null) {
            return "";
        }
        Matcher m = LEADING_YEAR.matcher(rawFiscalYear.trim());
        if (!m.find()) {
            return rawFiscalYear;
        }
        int startYear = Integer.parseInt(m.group(1));
        int nextYearSuffix = (startYear + 1) % 1000;
        return "%d.%03d".formatted(startYear, nextYearSuffix);
    }

    private static String nullToBlank(String value) {
        return value == null ? "" : value;
    }

    private static BigDecimal n(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}
