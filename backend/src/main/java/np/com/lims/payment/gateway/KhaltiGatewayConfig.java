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
import org.springframework.http.MediaType;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Real gateway to Khalti's ePayment v2 API, implementing the flow documented at
 * docs.khalti.com: {@code POST /epayment/initiate/} returns a {@code pidx} + hosted
 * {@code payment_url} to redirect the browser to; {@code POST /epayment/lookup/} is the
 * server-to-server status check used to actually confirm payment (never the browser redirect
 * alone). Authenticated via an {@code Authorization: Key <secret>} header, not OAuth.
 *
 * <h2>Verification status — NOT yet proven against a working sandbox</h2>
 * Confirmed live on 2026-09-10 that the request reaches Khalti and the auth header format is
 * accepted at the protocol level (a well-formed 401 "Invalid token" came back, correctly
 * surfaced through {@link InitiateResult#failed}) — but a previously commonly-documented shared
 * sandbox key no longer works: Khalti now requires signing up at test-admin.khalti.com (OTP
 * 987654) for a real sandbox {@code live_secret_key}. This implementation has NOT been verified
 * against an actual successful initiate/lookup response; do that before relying on it.
 */
@Configuration
@EnableConfigurationProperties(KhaltiProperties.class)
public class KhaltiGatewayConfig {

    private static final Logger log = LoggerFactory.getLogger(KhaltiGatewayConfig.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Bean(name = "khaltiGateway")
    @ConditionalOnProperty(prefix = "lims.payment.khalti", name = "enabled", havingValue = "true")
    public PaymentGateway khaltiGateway(KhaltiProperties properties, RestClient.Builder restClientBuilder) {
        org.springframework.http.client.SimpleClientHttpRequestFactory requestFactory =
                new org.springframework.http.client.SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(10));
        requestFactory.setReadTimeout(Duration.ofSeconds(20));
        RestClient client = restClientBuilder.baseUrl(properties.baseUrl()).requestFactory(requestFactory).build();
        return new Impl(properties, client);
    }

    private record Impl(KhaltiProperties properties, RestClient client) implements PaymentGateway {

        @Override
        public PaymentProvider provider() {
            return PaymentProvider.KHALTI;
        }

        @Override
        public boolean isConfigured() {
            return properties.isFullyConfigured();
        }

        @Override
        public InitiateResult initiate(InitiatePayload payload) {
            if (!properties.isFullyConfigured()) {
                return InitiateResult.failed("Khalti is not configured. No checkout was started.");
            }

            Map<String, Object> body = new LinkedHashMap<>();
            body.put("return_url", payload.successUrl());
            body.put("website_url", properties.websiteUrl());
            body.put("amount", payload.amount().multiply(BigDecimal.valueOf(100)).intValueExact()); // NPR -> paisa
            body.put("purchase_order_id", payload.transactionUuid());
            body.put("purchase_order_name", payload.purchaseOrderName());
            if (payload.customerName() != null || payload.customerPhone() != null) {
                Map<String, Object> customer = new LinkedHashMap<>();
                if (payload.customerName() != null) customer.put("name", payload.customerName());
                if (payload.customerPhone() != null) customer.put("phone", payload.customerPhone());
                body.put("customer_info", customer);
            }

            String raw;
            try {
                raw = client.post()
                        .uri("/epayment/initiate/")
                        .header("Authorization", "Key " + properties.secretKey())
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(body)
                        .retrieve()
                        .body(String.class);
            } catch (RestClientException ex) {
                log.warn("Khalti initiate failed for {}: {}", payload.transactionUuid(), ex.toString());
                return InitiateResult.failed("Khalti initiate call failed: " + ex.getMessage());
            }

            try {
                JsonNode node = MAPPER.readTree(raw);
                String paymentUrl = node.path("payment_url").asText(null);
                if (paymentUrl == null) {
                    return InitiateResult.failed("Khalti did not return a payment_url: " + raw);
                }
                return InitiateResult.redirect(paymentUrl, raw);
            } catch (Exception ex) {
                return InitiateResult.failed("Unrecognised Khalti response: " + raw);
            }
        }

        @Override
        public VerifyResult verify(String transactionUuid, BigDecimal expectedAmount) {
            if (!properties.isFullyConfigured()) {
                return VerifyResult.notVerified("Khalti is not configured. Nothing was verified.", null);
            }
            // Khalti's lookup takes the pidx it returned at initiate time, not our transaction_uuid
            // directly — callers pass whichever identifier they stored as providerReference from
            // initiate(); OnlinePaymentService is responsible for using the right one here.
            String raw;
            try {
                raw = client.post()
                        .uri("/epayment/lookup/")
                        .header("Authorization", "Key " + properties.secretKey())
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(Map.of("pidx", transactionUuid))
                        .retrieve()
                        .body(String.class);
            } catch (RestClientException ex) {
                log.warn("Khalti lookup failed for {}: {}", transactionUuid, ex.toString());
                return VerifyResult.notVerified("Khalti lookup call failed: " + ex.getMessage(), null);
            }

            try {
                JsonNode node = MAPPER.readTree(raw);
                String status = node.path("status").asText("");
                if ("Completed".equals(status)) {
                    return VerifyResult.verified(node.path("transaction_id").asText(transactionUuid), raw);
                }
                return VerifyResult.notVerified("Khalti reports status " + status, raw);
            } catch (Exception ex) {
                return VerifyResult.notVerified("Unrecognised Khalti response: " + raw, raw);
            }
        }
    }
}
