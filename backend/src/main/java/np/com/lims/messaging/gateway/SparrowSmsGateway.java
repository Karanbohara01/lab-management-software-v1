package np.com.lims.messaging.gateway;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import np.com.lims.common.crypto.CryptoService;
import np.com.lims.common.tenant.TenantContext;
import np.com.lims.messaging.SmsCredentialsRepository;
import np.com.lims.messaging.entity.SmsCredentials;
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
 * Real gateway to Sparrow SMS's v2 Bulk SMS API (docs.sparrowsms.com), the leading SMS aggregator
 * serving Nepal's telecom operators (Nepal Telecom, Ncell, United Telecom, Smart Telecom).
 * {@code POST https://api.sparrowsms.com/v2/sms/} (form-encoded {@code token/from/to/text});
 * response is JSON {@code {"count":N,"response_code":200,"response":"..."}} on success, or a
 * non-200 {@code response_code} with one of Sparrow's documented error codes/messages (e.g. 1002
 * "Invalid Token", 1013 "Insufficient Credits") on failure.
 *
 * <h2>Verification status — the documented endpoint does NOT respond as documented; do not trust
 * this without re-confirming the real URL first</h2>
 * Built directly from Sparrow's own published docs (docs.sparrowsms.com, consistently citing
 * {@code api.sparrowsms.com/v2/sms/}), but a live connectivity check against that exact URL
 * (2026-09-11, no account needed to observe this — a malformed/fake token should get a JSON error
 * response, not this) got a bare {@code 404 Not Found} from nginx for both GET and POST; the
 * sibling path {@code /sms/} (no {@code /v2}) returns an unconditional {@code 301} to
 * {@code docs.sparrowsms.com} regardless of method or parameters. Either the public docs are
 * stale/wrong, or their production API sits behind a different, undocumented path. Same class of
 * situation as Khalti's dead shared test key before its sandbox was properly set up — resolve by
 * signing up for a real account at sparrowsms.com and confirming the exact working URL from their
 * own dashboard/examples before flipping {@code lims.sms.enabled=true} in production.
 */
@Configuration
@EnableConfigurationProperties(SmsProperties.class)
public class SparrowSmsGateway {

    private static final Logger log = LoggerFactory.getLogger(SparrowSmsGateway.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Bean
    public SmsGateway smsGateway(SmsProperties properties, RestClient.Builder restClientBuilder,
                                 SmsCredentialsRepository credentialsRepository, CryptoService cryptoService) {
        org.springframework.http.client.SimpleClientHttpRequestFactory requestFactory =
                new org.springframework.http.client.SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(10));
        requestFactory.setReadTimeout(Duration.ofSeconds(20));
        RestClient client = restClientBuilder.requestFactory(requestFactory).build();
        return new Impl(properties, client, credentialsRepository, cryptoService);
    }

    /** Sender identity + API token actually in effect for the current request's organization. */
    private record Effective(boolean configured, String from, String token) {
    }

    private record Impl(SmsProperties properties, RestClient client, SmsCredentialsRepository credentialsRepository,
                        CryptoService cryptoService) implements SmsGateway {

        /**
         * An organization's own Sparrow SMS account (set via Settings) wins when it has enabled
         * SMS and fully configured a sender id + token; otherwise this deployment's shared
         * application.yml config is used — so a clinic that hasn't set anything up keeps
         * behaving exactly as before this per-organization override existed.
         */
        private Effective resolve() {
            Long orgId = TenantContext.get();
            if (orgId != null) {
                SmsCredentials c = credentialsRepository.findByOrganizationId(orgId).orElse(null);
                if (c != null && c.fullyConfigured()) {
                    return new Effective(true, c.getSmsFrom(), cryptoService.decrypt(c.getSmsTokenEncrypted()));
                }
            }
            return new Effective(properties.isFullyConfigured(), properties.from(), properties.apiKey());
        }

        @Override
        public String provider() {
            return properties.provider() == null || properties.provider().isBlank() ? "Sparrow SMS" : properties.provider();
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
                        "SMS delivery is not configured for this organization (neither its own "
                                + "credentials nor this deployment's shared ones are fully set). No message was sent.");
            }

            MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
            form.add("token", effective.token());
            form.add("from", effective.from());
            form.add("to", toPhone);
            form.add("text", message);

            String raw;
            try {
                raw = client.post()
                        .uri(properties.baseUrl())
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                        .body(form)
                        .retrieve()
                        .body(String.class);
            } catch (RestClientException ex) {
                log.warn("Sparrow SMS send failed for {}: {}", toPhone, ex.toString());
                return Result.transportError("SMS_UNREACHABLE", "Sparrow SMS call failed: " + ex.getMessage());
            }

            try {
                JsonNode node = MAPPER.readTree(raw);
                int responseCode = node.path("response_code").asInt(-1);
                if (responseCode == 200) {
                    return Result.sent(node.path("response").asText(null));
                }
                return Result.transportError(String.valueOf(responseCode), node.path("response").asText(raw));
            } catch (Exception ex) {
                return Result.transportError("SMS_UNRECOGNISED_RESPONSE", "Unrecognised Sparrow SMS response: " + raw);
            }
        }
    }
}
