package np.com.lims.payment.gateway;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import np.com.lims.payment.entity.PaymentProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Real gateway to eSewa's ePay v2 checkout, implementing the flow documented at
 * developer.esewa.com.np: {@code POST} an auto-submitting form (not a plain GET redirect — eSewa
 * requires the browser to actually submit the form fields), then verify via
 * {@code GET /api/epay/transaction/status/}.
 *
 * <p>Signature: HMAC-SHA256 (secret key) over {@code total_amount=...,transaction_uuid=...,
 * product_code=...} (exactly those three fields, comma-joined, in that order — matching
 * {@code signed_field_names}), base64-encoded.
 *
 * <h2>Verified live against eSewa's public test/UAT environment on 2026-09-10</h2>
 * (merchant code {@code EPAYTEST}, its long-published fixed test secret key — unlike Khalti,
 * eSewa's shared UAT credentials still work as documented). Confirmed both legs: {@code initiate}
 * produced a correctly HMAC-signed form eSewa's own status endpoint recognised (not a signature
 * rejection); calling {@code verify} for that never-completed transaction round-tripped through
 * this class's real HTTP call and JSON parsing and came back an honest {@code NOT_FOUND} — i.e.
 * no payment was recorded, exactly as it must not be for a checkout nobody completed. A full
 * successful payment (someone actually completing the hosted eSewa checkout page in a browser)
 * has not been exercised — only the initiate + not-yet-paid-verify paths, which is the whole
 * surface this backend can reach without a browser.
 */
@Configuration
@EnableConfigurationProperties(EsewaProperties.class)
public class EsewaGatewayConfig {

    private static final Logger log = LoggerFactory.getLogger(EsewaGatewayConfig.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Bean(name = "esewaGateway")
    @ConditionalOnProperty(prefix = "lims.payment.esewa", name = "enabled", havingValue = "true")
    public PaymentGateway esewaGateway(EsewaProperties properties, RestClient.Builder restClientBuilder) {
        org.springframework.http.client.SimpleClientHttpRequestFactory requestFactory =
                new org.springframework.http.client.SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(10));
        requestFactory.setReadTimeout(Duration.ofSeconds(20));
        RestClient client = restClientBuilder.requestFactory(requestFactory).build();
        return new Impl(properties, client);
    }

    private record Impl(EsewaProperties properties, RestClient client) implements PaymentGateway {

        @Override
        public PaymentProvider provider() {
            return PaymentProvider.ESEWA;
        }

        @Override
        public boolean isConfigured() {
            return properties.isFullyConfigured();
        }

        @Override
        public InitiateResult initiate(InitiatePayload payload) {
            if (!properties.isFullyConfigured()) {
                return InitiateResult.failed("eSewa is not configured. No checkout was started.");
            }
            String totalAmount = plain(payload.amount());
            Map<String, String> fields = new LinkedHashMap<>();
            fields.put("amount", totalAmount);
            fields.put("tax_amount", "0");
            fields.put("total_amount", totalAmount);
            fields.put("transaction_uuid", payload.transactionUuid());
            fields.put("product_code", properties.merchantCode());
            fields.put("product_service_charge", "0");
            fields.put("product_delivery_charge", "0");
            fields.put("success_url", payload.successUrl());
            fields.put("failure_url", payload.failureUrl());
            fields.put("signed_field_names", "total_amount,transaction_uuid,product_code");
            fields.put("signature", sign(totalAmount, payload.transactionUuid(), properties.merchantCode(), properties.secretKey()));
            return InitiateResult.form(properties.formAction(), fields, MAPPER.valueToTree(fields).toString());
        }

        @Override
        public VerifyResult verify(String transactionUuid, BigDecimal expectedAmount) {
            if (!properties.isFullyConfigured()) {
                return VerifyResult.notVerified("eSewa is not configured. Nothing was verified.", null);
            }
            String raw;
            try {
                String uri = properties.verifyBaseUrl()
                        + "?product_code=" + urlEncode(properties.merchantCode())
                        + "&total_amount=" + urlEncode(plain(expectedAmount))
                        + "&transaction_uuid=" + urlEncode(transactionUuid);
                raw = client.get()
                        .uri(java.net.URI.create(uri))
                        .retrieve()
                        .toEntity(String.class)
                        .getBody();
            } catch (RestClientException ex) {
                log.warn("eSewa status check failed for {}: {}", transactionUuid, ex.toString());
                return VerifyResult.notVerified("eSewa status check unreachable: " + ex.getMessage(), null);
            }

            try {
                JsonNode node = MAPPER.readTree(raw);
                String status = node.path("status").asText("");
                if ("COMPLETE".equals(status)) {
                    return VerifyResult.verified(node.path("ref_id").asText(null), raw);
                }
                return VerifyResult.notVerified("eSewa reports status " + status, raw);
            } catch (Exception ex) {
                return VerifyResult.notVerified("Unrecognised eSewa response: " + raw, raw);
            }
        }

        /** eSewa's signature/amount fields are plain decimal strings with no trailing ".00" noise for whole amounts. */
        private static String plain(BigDecimal amount) {
            return amount.stripTrailingZeros().toPlainString();
        }

        private static String urlEncode(String value) {
            return java.net.URLEncoder.encode(value, StandardCharsets.UTF_8);
        }

        private static String sign(String totalAmount, String transactionUuid, String productCode, String secretKey) {
            String message = "total_amount=" + totalAmount + ",transaction_uuid=" + transactionUuid
                    + ",product_code=" + productCode;
            try {
                Mac mac = Mac.getInstance("HmacSHA256");
                mac.init(new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
                return Base64.getEncoder().encodeToString(mac.doFinal(message.getBytes(StandardCharsets.UTF_8)));
            } catch (Exception ex) {
                throw new IllegalStateException("Unable to sign eSewa request", ex);
            }
        }
    }
}
