package np.com.lims.payment.gateway;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import np.com.lims.common.crypto.CryptoService;
import np.com.lims.common.tenant.TenantContext;
import np.com.lims.payment.PaymentCredentialsRepository;
import np.com.lims.payment.entity.PaymentCredentials;
import np.com.lims.payment.entity.PaymentProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
    public PaymentGateway khaltiGateway(KhaltiProperties properties, RestClient.Builder restClientBuilder,
                                        PaymentCredentialsRepository credentialsRepository, CryptoService cryptoService) {
        org.springframework.http.client.SimpleClientHttpRequestFactory requestFactory =
                new org.springframework.http.client.SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(10));
        requestFactory.setReadTimeout(Duration.ofSeconds(20));
        RestClient client = restClientBuilder.baseUrl(properties.baseUrl()).requestFactory(requestFactory).build();
        return new Impl(properties, client, credentialsRepository, cryptoService);
    }

    /** Secret key actually in effect for the current request's organization. */
    private record Effective(boolean configured, String secretKey) {
    }

    private record Impl(KhaltiProperties properties, RestClient client,
                        PaymentCredentialsRepository credentialsRepository, CryptoService cryptoService)
            implements PaymentGateway {

        /**
         * An organization's own secret (set via Settings) wins when it has enabled Khalti and
         * fully configured one; otherwise this deployment's shared application.yml config is
         * used — so a clinic that hasn't set anything up keeps working exactly as before this
         * per-organization override existed.
         */
        private Effective resolve() {
            Long orgId = TenantContext.get();
            if (orgId != null) {
                PaymentCredentials c = credentialsRepository.findByOrganizationId(orgId).orElse(null);
                if (c != null && c.khaltiFullyConfigured()) {
                    return new Effective(true, cryptoService.decrypt(c.getKhaltiSecretKeyEncrypted()));
                }
            }
            return new Effective(properties.isFullyConfigured(), properties.secretKey());
        }

        @Override
        public PaymentProvider provider() {
            return PaymentProvider.KHALTI;
        }

        @Override
        public boolean isConfigured() {
            return resolve().configured();
        }

        @Override
        public InitiateResult initiate(InitiatePayload payload) {
            Effective effective = resolve();
            if (!effective.configured()) {
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
                        .header("Authorization", "Key " + effective.secretKey())
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
            Effective effective = resolve();
            if (!effective.configured()) {
                return VerifyResult.notVerified("Khalti is not configured. Nothing was verified.", null);
            }
            // Khalti's lookup takes the pidx it returned at initiate time, not our transaction_uuid
            // directly — callers pass whichever identifier they stored as providerReference from
            // initiate(); OnlinePaymentService is responsible for using the right one here.
            String raw;
            try {
                raw = client.post()
                        .uri("/epayment/lookup/")
                        .header("Authorization", "Key " + effective.secretKey())
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

        @Override
        public VatRefundResult reportVatRefund(VatRefundPayload payload) {
            // Same honest gap as eSewa: the Anusuchi-8 refund-reporting call is a different,
            // undocumented endpoint from Khalti's initiate/lookup APIs above.
            return VatRefundResult.notSupported("Khalti");
        }
    }
}
