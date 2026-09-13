package np.com.lims.platform.billing;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import np.com.lims.payment.gateway.EsewaProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.stereotype.Component;
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
 * eSewa checkout for the PLATFORM billing a CLINIC for its own subscription — deliberately a
 * separate, standalone client from {@code np.com.lims.payment.gateway.EsewaGatewayConfig}, which
 * bills a clinic's PATIENTS and resolves that clinic's OWN merchant credentials via
 * {@code TenantContext}. Reusing that class here would be a real bug: a clinic paying its platform
 * subscription must always go through THIS deployment's own merchant account
 * ({@code lims.payment.esewa.*}), never the clinic's own (that clinic paying itself makes no
 * sense, and a clinic without its own eSewa account configured would be unable to pay its bill at
 * all). This class never touches {@code TenantContext} or {@code PaymentCredentialsRepository} —
 * only the shared {@link EsewaProperties} bean, on purpose.
 */
@Component
@EnableConfigurationProperties(EsewaProperties.class)
public class PlatformEsewaClient {

    private static final Logger log = LoggerFactory.getLogger(PlatformEsewaClient.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final EsewaProperties properties;
    private final RestClient client;

    public PlatformEsewaClient(EsewaProperties properties, RestClient.Builder restClientBuilder) {
        this.properties = properties;
        org.springframework.http.client.SimpleClientHttpRequestFactory requestFactory =
                new org.springframework.http.client.SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(10));
        requestFactory.setReadTimeout(Duration.ofSeconds(20));
        this.client = restClientBuilder.requestFactory(requestFactory).build();
    }

    public boolean isConfigured() {
        return properties.isFullyConfigured();
    }

    public record InitiateResult(boolean success, String formAction, Map<String, String> formFields, String errorMessage) {
    }

    public record VerifyResult(boolean verified, String providerReference, String errorMessage) {
    }

    public InitiateResult initiate(String transactionUuid, BigDecimal amount, String successUrl, String failureUrl) {
        if (!properties.isFullyConfigured()) {
            return new InitiateResult(false, null, null,
                    "This deployment's own eSewa merchant account is not configured — subscription billing is unavailable.");
        }
        String totalAmount = plain(amount);
        Map<String, String> fields = new LinkedHashMap<>();
        fields.put("amount", totalAmount);
        fields.put("tax_amount", "0");
        fields.put("total_amount", totalAmount);
        fields.put("transaction_uuid", transactionUuid);
        fields.put("product_code", properties.merchantCode());
        fields.put("product_service_charge", "0");
        fields.put("product_delivery_charge", "0");
        fields.put("success_url", successUrl);
        fields.put("failure_url", failureUrl);
        fields.put("signed_field_names", "total_amount,transaction_uuid,product_code");
        fields.put("signature", sign(totalAmount, transactionUuid, properties.merchantCode(), properties.secretKey()));
        return new InitiateResult(true, properties.formAction(), fields, null);
    }

    public VerifyResult verify(String transactionUuid, BigDecimal expectedAmount) {
        if (!properties.isFullyConfigured()) {
            return new VerifyResult(false, null, "eSewa is not configured. Nothing was verified.");
        }
        String raw;
        try {
            String uri = properties.verifyBaseUrl()
                    + "?product_code=" + urlEncode(properties.merchantCode())
                    + "&total_amount=" + urlEncode(plain(expectedAmount))
                    + "&transaction_uuid=" + urlEncode(transactionUuid);
            raw = client.get().uri(java.net.URI.create(uri)).retrieve().toEntity(String.class).getBody();
        } catch (RestClientException ex) {
            log.warn("Platform eSewa status check failed for {}: {}", transactionUuid, ex.toString());
            return new VerifyResult(false, null, "eSewa status check unreachable: " + ex.getMessage());
        }
        try {
            JsonNode node = MAPPER.readTree(raw);
            String status = node.path("status").asText("");
            if ("COMPLETE".equals(status)) {
                return new VerifyResult(true, node.path("ref_id").asText(null), null);
            }
            return new VerifyResult(false, null, "eSewa reports status " + status);
        } catch (Exception ex) {
            return new VerifyResult(false, null, "Unrecognised eSewa response: " + raw);
        }
    }

    private static String plain(BigDecimal amount) {
        return amount.stripTrailingZeros().toPlainString();
    }

    private static String urlEncode(String value) {
        return java.net.URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private static String sign(String totalAmount, String transactionUuid, String productCode, String secretKey) {
        String message = "total_amount=" + totalAmount + ",transaction_uuid=" + transactionUuid + ",product_code=" + productCode;
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return Base64.getEncoder().encodeToString(mac.doFinal(message.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to sign eSewa request", ex);
        }
    }
}
