package np.com.lims.communication.gateway;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import np.com.lims.common.crypto.CryptoService;
import np.com.lims.common.tenant.TenantContext;
import np.com.lims.communication.SmsSegmentCalculator;
import np.com.lims.messaging.SmsCredentialsRepository;
import np.com.lims.messaging.entity.SmsCredentials;
import np.com.lims.messaging.gateway.SmsGateway;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.time.Duration;

/**
 * Real gateway to Samaya SMS (Samaya Technology Pvt. Ltd., Nepal — samayasms.com /
 * samayasms.com.np).
 *
 * <h2>Verification status — READ BEFORE RELYING ON THIS IN PRODUCTION</h2>
 * Samaya SMS publishes no developer portal, no API reference, no Postman collection and no
 * self-service sandbox. A thorough search (11 distinct queries, 12 pages fetched, including the
 * vendor's own marketing site, FAQ, pricing/quote page, and customer portal) turned up exactly one
 * technical artifact: an unofficial-looking but apparently vendor-published PHP client library at
 * {@code github.com/samayatech/sms-api} — created and last modified 2018-04-02, never updated or
 * versioned since, with no stars/forks/issues. This gateway is implemented EXACTLY against that
 * library's documented request/response shape (quoted in full below) because it is the only real,
 * concrete thing to build against, consistent with this codebase's rule of never inventing an
 * endpoint shape — but it is eight years old and could plausibly be stale relative to whatever the
 * live samayasms.com.np platform actually runs today. Before enabling this for a real clinic,
 * confirm the exact base URL and parameter names with Samaya support directly
 * (info@samayasms.com, +977-1-5233434) — the same "verify against a live sandbox before trusting
 * published docs" caution this codebase's Sparrow SMS and Khalti integrations both document.
 *
 * <p><b>What the 2018 library documents, verbatim:</b>
 * <pre>
 * POST &lt;install-host&gt;/sms/api   (form-urlencoded body)
 *   action=send-sms&amp;api_key=...&amp;to=...&amp;from=...&amp;sms=...&amp;unicode=0|1
 * Success: {"code":"ok","message":"Successfully Send"}
 * Errors:  100 Bad gateway requested · 101 Wrong action · 102 Authentication failed
 *          103 Invalid phone number · 104 Phone coverage not active
 *          105 Insufficient balance · 106 Invalid Sender ID
 * </pre>
 * This is a self-hosted-per-customer-install pattern (the base URL is whatever host the
 * customer's own Samaya instance runs on, not one shared cloud domain), which is why {@code
 * baseUrl} is a configured field here exactly like {@link np.com.lims.messaging.gateway.SmsProperties}'s
 * is for Sparrow, rather than a hardcoded constant — there is no single public endpoint to
 * hardcode even if we wanted to.
 *
 * <p><b>What is explicitly NOT documented anywhere found</b> (do not assume any of this without
 * confirming with Samaya first): a true bulk-send endpoint or parameter (this gateway sends one
 * HTTP request per recipient — see {@code SmsCampaignWorker} — never a fabricated "send to N
 * numbers at once" call); any delivery-report/webhook/DLR mechanism (so {@code SmsMessage} never
 * reaches {@code DELIVERED} through this gateway — see that entity's javadoc); the exact JSON
 * shape of a balance-check response (this gateway's {@link #checkBalance()} parses only what the
 * 2018 docs show structurally and returns the raw decoded value under a best-effort key, clearly
 * marked as unconfirmed); per-segment billing rules (see {@link SmsSegmentCalculator}'s javadoc);
 * rate limits; or sender-ID registration requirements.
 *
 * <p>The vendor's own reference implementation builds its POST body by hand without
 * URL-encoding the parameter VALUES (only the keys) — a real bug in their sample code that would
 * corrupt message text containing {@code &amp;} or {@code =}. This implementation avoids that
 * entirely by using Spring's standard {@link MultiValueMap} + form-urlencoded {@link RestClient}
 * submission, which correctly encodes every value — the same safe mechanism
 * {@link np.com.lims.messaging.gateway.SparrowSmsGateway} already uses.
 */
@Configuration
@EnableConfigurationProperties(SamayaSmsProperties.class)
public class SamayaSmsGateway {

    private static final Logger log = LoggerFactory.getLogger(SamayaSmsGateway.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();

    /**
     * Named {@code samayaGateway}, NOT {@code samayaSmsGateway} — that name collides with this
     * {@code @Configuration} class's own default Spring bean name (which decapitalizes to
     * {@code samayaSmsGateway}), and registering both under the same name fails application
     * startup with a {@code BeanDefinitionOverrideException}. {@code SmsGatewayRegistry} looks
     * this bean up by this exact name via {@code @Qualifier}.
     */
    @Bean
    public SmsGateway samayaGateway(SamayaSmsProperties properties, RestClient.Builder restClientBuilder,
                                       SmsCredentialsRepository credentialsRepository, CryptoService cryptoService) {
        var requestFactory = new org.springframework.http.client.SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(10));
        requestFactory.setReadTimeout(Duration.ofSeconds(20));
        RestClient client = restClientBuilder.requestFactory(requestFactory).build();
        return new Impl(properties, client, credentialsRepository, cryptoService);
    }

    private record Effective(boolean configured, String baseUrl, String senderId, String apiKey) {
    }

    /** A best-effort parse of {@code check-balance}'s response — see the class javadoc; the exact field name is unconfirmed. */
    public record BalanceResult(boolean available, String rawResponse, Long balance, String errorMessage) {
    }

    private record Impl(SamayaSmsProperties properties, RestClient client, SmsCredentialsRepository credentialsRepository,
                        CryptoService cryptoService) implements SmsGateway, BalanceCheckableGateway {

        private Effective resolve() {
            Long orgId = TenantContext.get();
            if (orgId != null) {
                SmsCredentials c = credentialsRepository.findByOrganizationId(orgId).orElse(null);
                if (c != null && c.isSamayaEnabled() && hasText(c.getSamayaBaseUrl())
                        && hasText(c.getSamayaSenderId()) && hasText(c.getSamayaApiKeyEncrypted())) {
                    return new Effective(true, c.getSamayaBaseUrl(), c.getSamayaSenderId(),
                            cryptoService.decrypt(c.getSamayaApiKeyEncrypted()));
                }
            }
            return new Effective(properties.isFullyConfigured(), properties.baseUrl(), properties.senderId(), properties.apiKey());
        }

        private static boolean hasText(String value) {
            return value != null && !value.isBlank();
        }

        @Override
        public String provider() {
            return "Samaya SMS";
        }

        @Override
        public boolean isConfigured() {
            return resolve().configured();
        }

        @Override
        public Result send(String toPhone, String message) {
            Effective effective = resolve();
            if (!effective.configured()) {
                return Result.transportError("SMS_NOT_CONFIGURED",
                        "Samaya SMS is not configured for this organization (neither its own "
                                + "credentials nor this deployment's shared ones are fully set). No message was sent.");
            }

            String normalizedTo = normalizePhone(toPhone);
            SmsSegmentCalculator.Estimate estimate = SmsSegmentCalculator.estimate(message);

            MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
            form.add("action", "send-sms");
            form.add("api_key", effective.apiKey());
            form.add("to", normalizedTo);
            form.add("from", effective.senderId());
            form.add("sms", message);
            form.add("unicode", estimate.encoding() == SmsSegmentCalculator.Encoding.UCS2 ? "1" : "0");

            String raw;
            try {
                raw = client.post()
                        .uri(effective.baseUrl())
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                        .body(form)
                        .retrieve()
                        .body(String.class);
            } catch (RestClientException ex) {
                log.warn("Samaya SMS send failed for {}: {}", normalizedTo, ex.toString());
                return Result.transportError("SMS_UNREACHABLE", "Samaya SMS call failed: " + ex.getMessage());
            }

            try {
                JsonNode node = MAPPER.readTree(raw);
                String code = node.path("code").asText("");
                if ("ok".equalsIgnoreCase(code)) {
                    // The 2018 docs show no per-message reference id in the success response —
                    // only {"code":"ok","message":"Successfully Send"} — so there is nothing to
                    // record as a provider reference beyond the fact that it was accepted.
                    return Result.sent(null);
                }
                String description = SAMAYA_ERROR_CODES.getOrDefault(code, node.path("message").asText(raw));
                return Result.transportError(code.isBlank() ? "SAMAYA_UNRECOGNISED_RESPONSE" : code, description);
            } catch (Exception ex) {
                return Result.transportError("SMS_UNRECOGNISED_RESPONSE", "Unrecognised Samaya SMS response: " + raw);
            }
        }

        /**
         * {@code action=check-balance} — documented to exist, but the 2018 reference never shows
         * what the response actually contains beyond the general {@code {"code":...}} envelope.
         * This parses defensively: looks for a handful of plausible field names
         * ({@code balance}, {@code sms_balance}, {@code credit}) and falls back to returning the
         * raw response text untouched if none match, rather than guessing a shape. The UI must
         * show {@link BalanceResult#rawResponse()} rather than inventing a number when
         * {@link BalanceResult#balance()} is null.
         */
        @Override
        public BalanceResult checkBalance() {
            Effective effective = resolve();
            if (!effective.configured()) {
                return new BalanceResult(false, null, null, "Samaya SMS is not configured.");
            }
            MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
            form.add("action", "check-balance");
            form.add("api_key", effective.apiKey());

            String raw;
            try {
                raw = client.post()
                        .uri(effective.baseUrl())
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                        .body(form)
                        .retrieve()
                        .body(String.class);
            } catch (RestClientException ex) {
                return new BalanceResult(false, null, null, "Samaya SMS balance check failed: " + ex.getMessage());
            }

            try {
                JsonNode node = MAPPER.readTree(raw);
                for (String key : new String[] {"balance", "sms_balance", "credit", "credits"}) {
                    if (node.has(key) && node.get(key).isNumber()) {
                        return new BalanceResult(true, raw, node.get(key).asLong(), null);
                    }
                }
                return new BalanceResult(true, raw, null, null);
            } catch (Exception ex) {
                return new BalanceResult(false, raw, null, "Unrecognised balance response: " + raw);
            }
        }

        /**
         * Samaya's documented contract requires the destination number to carry its country code
         * at the front. Patient phone numbers in this system are stored as plain 10-digit Nepali
         * mobile numbers (98XXXXXXXX/97XXXXXXXX) — this prefixes 977 only when the number doesn't
         * already look internationally formatted, rather than assuming every stored number is bare.
         */
        private static String normalizePhone(String phone) {
            String digits = phone == null ? "" : phone.replaceAll("[^0-9]", "");
            if (digits.startsWith("977") && digits.length() > 10) {
                return digits;
            }
            return "977" + digits;
        }
    }

    private static final java.util.Map<String, String> SAMAYA_ERROR_CODES = java.util.Map.of(
            "100", "Bad gateway requested",
            "101", "Wrong action",
            "102", "Authentication failed — check the Samaya API key",
            "103", "Invalid phone number",
            "104", "Phone coverage not active for this number",
            "105", "Insufficient Samaya SMS balance",
            "106", "Invalid Sender ID"
    );
}
