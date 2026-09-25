package np.com.lims.payment.gateway;

import np.com.lims.common.tenant.TenantContext;
import np.com.lims.payment.PaymentCredentialsRepository;
import np.com.lims.payment.entity.PaymentCredentials;
import np.com.lims.payment.entity.PaymentProvider;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;

/**
 * Third payment-gateway slot in the {@link PaymentGatewayRegistry} plugin architecture, alongside
 * {@link EsewaGatewayConfig}/{@link KhaltiGatewayConfig} — proves a clinic isn't limited to those
 * two providers; adding one is exactly this: a new {@link PaymentProvider} enum constant, a
 * credentials column set, and one class implementing {@link PaymentGateway}.
 *
 * <h2>Deliberately not wired to a real endpoint yet</h2>
 * Unlike eSewa (live-verified against its public UAT sandbox) and Khalti (real code against a
 * documented API, only unverified because its public sandbox key was retired), Fonepay's actual
 * merchant checkout wire protocol — request field names, HMAC scheme, endpoint paths — was not
 * available from an authoritative source when this was written: Fonepay's public merchant
 * enrollment page (fonepay.com/business/merchant-enrollment) is a QR sign-up form, not API docs,
 * and secondary sources (blog posts, a Scribd summary) were incomplete or unreachable. One
 * initially-promising GitHub result ({@code RakeshTejra/fonepaisa}) turned out to be an unrelated
 * product ("fonePaisa", api.fonepaisa.com) — exactly the kind of mix-up that must not end up
 * silently baked into a live payment integration.
 *
 * <p>So credentials CAN be entered and stored (a real clinic can fill in what their merchant
 * enrollment gives them, ready for when the wire call is built) and {@link #isConfigured()}
 * reflects that honestly — but {@link Impl#initiate} and {@link Impl#verify} always refuse with a
 * clear "not yet implemented" error, never a guessed HTTP call. Replace this class's body with a
 * real implementation once Fonepay's actual merchant API documentation (or sandbox credentials) is
 * obtained, following the same live-verify-before-trusting discipline used for eSewa/Khalti/CBMS.
 */
@Configuration
@EnableConfigurationProperties(FonepayProperties.class)
public class FonepayGatewayConfig {

    @Bean(name = "fonepayGateway")
    public PaymentGateway fonepayGateway(FonepayProperties properties, PaymentCredentialsRepository credentialsRepository) {
        return new Impl(properties, credentialsRepository);
    }

    private record Impl(FonepayProperties properties, PaymentCredentialsRepository credentialsRepository)
            implements PaymentGateway {

        private boolean credentialsPresent() {
            Long orgId = TenantContext.get();
            if (orgId != null) {
                PaymentCredentials c = credentialsRepository.findByOrganizationId(orgId).orElse(null);
                if (c != null && c.fonepayFullyConfigured()) {
                    return true;
                }
            }
            return properties.enabled() && hasText(properties.merchantCode()) && hasText(properties.secretKey());
        }

        @Override
        public PaymentProvider provider() {
            return PaymentProvider.FONEPAY;
        }

        @Override
        public boolean isConfigured() {
            return credentialsPresent();
        }

        @Override
        public InitiateResult initiate(InitiatePayload payload) {
            return InitiateResult.failed("Fonepay checkout is not yet implemented — credentials are stored, "
                    + "but this deployment has not been wired to Fonepay's real merchant API yet. No checkout was started.");
        }

        @Override
        public VerifyResult verify(String transactionUuid, BigDecimal expectedAmount) {
            return VerifyResult.notVerified("Fonepay verification is not yet implemented. Nothing was verified.", null);
        }

        @Override
        public VatRefundResult reportVatRefund(VatRefundPayload payload) {
            return VatRefundResult.notSupported("Fonepay");
        }

        private static boolean hasText(String value) {
            return value != null && !value.isBlank();
        }
    }
}
