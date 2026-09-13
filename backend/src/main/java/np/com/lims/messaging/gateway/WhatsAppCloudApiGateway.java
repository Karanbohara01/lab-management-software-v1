package np.com.lims.messaging.gateway;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import np.com.lims.common.crypto.CryptoService;
import np.com.lims.common.tenant.TenantContext;
import np.com.lims.messaging.WhatsAppCredentialsRepository;
import np.com.lims.messaging.entity.WhatsAppCredentials;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.time.Duration;
import java.util.Map;

/**
 * Real gateway to Meta's WhatsApp Business Cloud API (developers.facebook.com/docs/whatsapp/cloud-api),
 * {@code POST https://graph.facebook.com/{version}/{phone-number-id}/messages}, Bearer-authenticated
 * with the account's permanent (or short-lived) access token, JSON body
 * {@code {"messaging_product":"whatsapp","to":"<E.164 digits>","type":"text","text":{"body":"..."}}}.
 * On success the response carries {@code messages[0].id}, used as the provider reference; on
 * failure the response carries an {@code error.code}/{@code error.message} pair that is surfaced
 * as-is rather than reinterpreted.
 *
 * <h2>Verification status — NOT live-verified against a real WhatsApp Business Account</h2>
 * Built directly from Meta's own published Cloud API reference (request/response shapes, auth
 * scheme, endpoint pattern are stable and widely used in production by other integrations), but —
 * unlike eSewa (public UAT sandbox) or IRD (public CBMS sandbox) — Meta's Cloud API has no
 * anonymous or shared sandbox to test against: every account requires real Meta Business
 * verification, a real WhatsApp Business Account, and a phone number Meta has approved, none of
 * which exist for this deployment. This has NOT been exercised against a live endpoint the way
 * eSewa/CBMS/Sparrow SMS have been this session — before flipping {@code lims.whatsapp.enabled=true}
 * in production, send one real test message via a verified account's dashboard first and confirm
 * the response shape below matches what actually comes back.
 *
 * <p>Recipient numbers must be in WhatsApp's expected format — digits only, country code first, no
 * {@code +}/spaces/dashes (e.g. Nepali {@code 9779800000000}); non-digit characters are stripped
 * before sending, but a caller passing a number without the country code will still fail at Meta's
 * end, not here.
 */
@Configuration
@EnableConfigurationProperties(WhatsAppProperties.class)
public class WhatsAppCloudApiGateway {

    private static final Logger log = LoggerFactory.getLogger(WhatsAppCloudApiGateway.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Bean
    public WhatsAppGateway whatsAppGateway(WhatsAppProperties properties, RestClient.Builder restClientBuilder,
                                           WhatsAppCredentialsRepository credentialsRepository, CryptoService cryptoService) {
        org.springframework.http.client.SimpleClientHttpRequestFactory requestFactory =
                new org.springframework.http.client.SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(10));
        requestFactory.setReadTimeout(Duration.ofSeconds(20));
        RestClient client = restClientBuilder.requestFactory(requestFactory).build();
        return new Impl(properties, client, credentialsRepository, cryptoService);
    }

    /** Phone number id + access token actually in effect for the current request's organization. */
    private record Effective(boolean configured, String phoneNumberId, String accessToken) {
    }

    private record Impl(WhatsAppProperties properties, RestClient client,
                        WhatsAppCredentialsRepository credentialsRepository,
                        CryptoService cryptoService) implements WhatsAppGateway {

        /**
         * An organization's own WhatsApp Business Account (set via Settings) wins when it has
         * enabled WhatsApp and fully configured a phone number id + access token; otherwise this
         * deployment's shared application.yml config is used — so a clinic that hasn't set
         * anything up keeps behaving exactly as before this per-organization override existed.
         */
        private Effective resolve() {
            Long orgId = TenantContext.get();
            if (orgId != null) {
                WhatsAppCredentials c = credentialsRepository.findByOrganizationId(orgId).orElse(null);
                if (c != null && c.fullyConfigured()) {
                    return new Effective(true, c.getPhoneNumberId(), cryptoService.decrypt(c.getAccessTokenEncrypted()));
                }
            }
            return new Effective(properties.isFullyConfigured(), properties.phoneNumberId(), properties.accessToken());
        }

        @Override
        public String provider() {
            return "WhatsApp Cloud API";
        }

        @Override
        public boolean isConfigured() {
            return resolve().configured();
        }

        @Override
        public Result send(String toPhone, String message) {
            Effective effective = resolve();
            if (!effective.configured()) {
                return Result.transportError("WHATSAPP_NOT_CONFIGURED",
                        "WhatsApp delivery is not configured for this organization (neither its own "
                                + "credentials nor this deployment's shared ones are fully set). No message was sent.");
            }

            String digitsOnly = toPhone == null ? "" : toPhone.replaceAll("[^0-9]", "");
            String version = properties.apiVersion() == null || properties.apiVersion().isBlank() ? "v20.0" : properties.apiVersion();
            String uri = "https://graph.facebook.com/" + version + "/" + effective.phoneNumberId() + "/messages";

            Map<String, Object> body = Map.of(
                    "messaging_product", "whatsapp",
                    "to", digitsOnly,
                    "type", "text",
                    "text", Map.of("body", message)
            );

            String raw;
            try {
                raw = client.post()
                        .uri(uri)
                        .header("Authorization", "Bearer " + effective.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(body)
                        .retrieve()
                        .body(String.class);
            } catch (RestClientResponseException ex) {
                String errBody = ex.getResponseBodyAsString();
                log.warn("WhatsApp send failed for {}: {} {}", toPhone, ex.getStatusCode(), errBody);
                String code = String.valueOf(ex.getStatusCode().value());
                String msg = errBody;
                try {
                    JsonNode err = MAPPER.readTree(errBody).path("error");
                    if (!err.isMissingNode()) {
                        code = err.path("code").asText(code);
                        msg = err.path("message").asText(errBody);
                    }
                } catch (Exception ignored) {
                    // fall through with raw body
                }
                return Result.transportError(code, msg);
            } catch (RestClientException ex) {
                log.warn("WhatsApp send failed for {}: {}", toPhone, ex.toString());
                return Result.transportError("WHATSAPP_UNREACHABLE", "WhatsApp Cloud API call failed: " + ex.getMessage());
            }

            try {
                JsonNode node = MAPPER.readTree(raw);
                JsonNode messages = node.path("messages");
                if (messages.isArray() && messages.size() > 0) {
                    return Result.sent(messages.get(0).path("id").asText(null));
                }
                return Result.transportError("WHATSAPP_UNRECOGNISED_RESPONSE", "Unrecognised WhatsApp response: " + raw);
            } catch (Exception ex) {
                return Result.transportError("WHATSAPP_UNRECOGNISED_RESPONSE", "Unrecognised WhatsApp response: " + raw);
            }
        }
    }
}
