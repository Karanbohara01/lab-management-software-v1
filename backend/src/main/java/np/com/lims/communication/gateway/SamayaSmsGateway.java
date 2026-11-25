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

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

/**
 * Real gateway to Samaya SMS (Samaya Technology Pvt. Ltd., Nepal — samayasms.com.np),
 * verified live against the SamayaSMS Developer API SDK:
 * <ul>
 *   <li><b>Send SMS</b> ({@code POST https://samayasms.com.np/smsapi/index.php},
 *       {@code application/x-www-form-urlencoded}):
 *       parameters {@code key} (API key), {@code type} ({@code text} or {@code unicode}),
 *       {@code contacts} (recipient phone number), {@code senderid} (Sender ID, e.g.
 *       {@code SmsBit}), and {@code msg} (message text). Returns plain text
 *       {@code SMS-SHOOT-ID/<id>} on success or {@code ERR: <reason>} on failure.</li>
 *   <li><b>Credit Balance API</b> ({@code GET https://samayasms.com.np/miscapi/<API_KEY>/getBalance/true/}):
 *       returns a JSON array {@code [{"ROUTE_ID":135,"ROUTE":"FSN_MAIN","BALANCE":26998}]}.</li>
 * </ul>
 */
@Configuration
@EnableConfigurationProperties(SamayaSmsProperties.class)
public class SamayaSmsGateway {

    private static final Logger log = LoggerFactory.getLogger(SamayaSmsGateway.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final String SHOOT_ID_PREFIX = "SMS-SHOOT-ID/";

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

    /** Parsed balance from SamayaSMS's Credit Balance API ({@code /miscapi/<key>/getBalance/true/}). */
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
                    return new Effective(true, c.getSamayaBaseUrl().trim(), c.getSamayaSenderId().trim(),
                            cryptoService.decrypt(c.getSamayaApiKeyEncrypted()).trim());
                }
            }
            return new Effective(
                    properties.isFullyConfigured(),
                    properties.baseUrl() == null ? null : properties.baseUrl().trim(),
                    properties.senderId() == null ? null : properties.senderId().trim(),
                    properties.apiKey() == null ? null : properties.apiKey().trim());
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
            String smsType = estimate.encoding() == SmsSegmentCalculator.Encoding.UCS2 ? "unicode" : "text";

            MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
            form.add("key", effective.apiKey());
            form.add("type", smsType);
            form.add("contacts", normalizedTo);
            form.add("senderid", effective.senderId());
            form.add("msg", message);

            String targetUrl = resolveSendUrl(effective.baseUrl());
            String raw;
            try {
                raw = client.post()
                        .uri(targetUrl)
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                        .body(form)
                        .retrieve()
                        .body(String.class);
            } catch (RestClientException ex) {
                log.warn("Samaya SMS send failed for {}: {}", normalizedTo, ex.toString());
                return Result.transportError("SMS_UNREACHABLE", "Samaya SMS call failed: " + ex.getMessage());
            }

            String trimmed = raw == null ? "" : raw.trim();
            if (trimmed.regionMatches(true, 0, SHOOT_ID_PREFIX, 0, SHOOT_ID_PREFIX.length())) {
                String shootId = trimmed.substring(SHOOT_ID_PREFIX.length()).trim();
                return Result.sent(shootId.isEmpty() ? trimmed : shootId);
            }
            if (trimmed.regionMatches(true, 0, "ERR:", 0, 4) || trimmed.regionMatches(true, 0, "ERR ", 0, 4)) {
                return Result.transportError("SAMAYA_ERR", trimmed);
            }

            if (trimmed.startsWith("{")) {
                try {
                    JsonNode node = MAPPER.readTree(trimmed);
                    String code = node.path("code").asText("");
                    if ("ok".equalsIgnoreCase(code)) {
                        return Result.sent(null);
                    }
                    String description = SAMAYA_ERROR_CODES.getOrDefault(code, node.path("message").asText(trimmed));
                    return Result.transportError(code.isBlank() ? "SAMAYA_UNRECOGNISED_RESPONSE" : code, description);
                } catch (Exception ex) {
                    return Result.transportError("SMS_UNRECOGNISED_RESPONSE", "Unrecognised Samaya SMS response: " + trimmed);
                }
            }

            return Result.transportError("SMS_UNRECOGNISED_RESPONSE",
                    trimmed.isEmpty() ? "Empty response from Samaya SMS" : "Unrecognised Samaya SMS response: " + trimmed);
        }

        @Override
        public BalanceResult checkBalance() {
            Effective effective = resolve();
            if (!effective.configured()) {
                return new BalanceResult(false, null, null, "Samaya SMS is not configured.");
            }
            String balanceUrl = resolveBalanceUrl(effective.baseUrl(), effective.apiKey());
            String raw;
            try {
                raw = client.get()
                        .uri(balanceUrl)
                        .retrieve()
                        .body(String.class);
            } catch (RestClientException ex) {
                return new BalanceResult(false, null, null, "Samaya SMS balance check failed: " + ex.getMessage());
            }

            String trimmed = raw == null ? "" : raw.trim();
            if (trimmed.isEmpty()) {
                return new BalanceResult(false, null, null, "Empty response from Samaya SMS balance endpoint.");
            }
            if (trimmed.regionMatches(true, 0, "ERR:", 0, 4)) {
                return new BalanceResult(false, trimmed, null, trimmed);
            }

            try {
                JsonNode node = MAPPER.readTree(trimmed);
                if (node.isArray() && !node.isEmpty()) {
                    long total = 0L;
                    boolean found = false;
                    for (JsonNode routeNode : node) {
                        for (String key : new String[] {"BALANCE", "balance", "sms_balance", "credit", "credits"}) {
                            if (routeNode.has(key) && (routeNode.get(key).isNumber() || routeNode.get(key).isTextual())) {
                                total += Math.round(Double.parseDouble(routeNode.get(key).asText().trim()));
                                found = true;
                                break;
                            }
                        }
                    }
                    if (found) {
                        return new BalanceResult(true, trimmed, total, null);
                    }
                } else if (node.isObject()) {
                    for (String key : new String[] {"BALANCE", "balance", "sms_balance", "credit", "credits"}) {
                        if (node.has(key) && (node.get(key).isNumber() || node.get(key).isTextual())) {
                            long bal = Math.round(Double.parseDouble(node.get(key).asText().trim()));
                            return new BalanceResult(true, trimmed, bal, null);
                        }
                    }
                }
                return new BalanceResult(true, trimmed, null, null);
            } catch (Exception ex) {
                return new BalanceResult(false, trimmed, null, "Unrecognised balance response: " + trimmed);
            }
        }

        /**
         * Normalizes a Nepali mobile number to the 10-digit format ({@code 98XXXXXXXX}/{@code 97XXXXXXXX})
         * expected by {@code samayasms.com.np/smsapi/index.php}.
         */
        private static String normalizePhone(String phone) {
            String digits = phone == null ? "" : phone.replaceAll("[^0-9]", "");
            if (digits.startsWith("977") && digits.length() == 13) {
                return digits.substring(3);
            }
            if (digits.startsWith("0") && digits.length() == 11) {
                return digits.substring(1);
            }
            return digits;
        }

        private static String resolveSendUrl(String baseUrl) {
            String trimmed = baseUrl.trim();
            try {
                URI uri = URI.create(trimmed);
                String path = uri.getPath();
                if (path == null || path.isEmpty() || "/".equals(path)) {
                    String base = trimmed.endsWith("/") ? trimmed.substring(0, trimmed.length() - 1) : trimmed;
                    return base + "/smsapi/index.php";
                }
            } catch (Exception ignored) {
                // Use as configured
            }
            return trimmed;
        }

        private static String resolveBalanceUrl(String baseUrl, String apiKey) {
            String encodedKey = URLEncoder.encode(apiKey, StandardCharsets.UTF_8);
            try {
                URI uri = URI.create(baseUrl.trim());
                if (uri.getScheme() != null && uri.getHost() != null) {
                    String portPart = uri.getPort() > 0 ? ":" + uri.getPort() : "";
                    return uri.getScheme() + "://" + uri.getHost() + portPart + "/miscapi/" + encodedKey + "/getBalance/true/";
                }
            } catch (Exception ignored) {
                // Fall through
            }
            String separator = baseUrl.contains("?") ? "&" : "?";
            return baseUrl + separator + "key=" + encodedKey;
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
