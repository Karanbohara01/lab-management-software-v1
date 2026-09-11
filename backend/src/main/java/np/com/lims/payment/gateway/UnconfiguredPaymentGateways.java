package np.com.lims.payment.gateway;

import np.com.lims.payment.entity.PaymentProvider;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;

/**
 * The active gateway for a provider until its real credentials are configured. Each provider
 * falls back independently (by specific bean NAME, not just type — so eSewa being configured
 * doesn't accidentally suppress Khalti's honest fallback, or vice versa). Transmits nothing;
 * every call returns a clear, honest "not configured" error.
 */
@Configuration
public class UnconfiguredPaymentGateways {

    @Bean(name = "esewaGateway")
    @ConditionalOnMissingBean(name = "esewaGateway")
    public PaymentGateway unconfiguredEsewaGateway() {
        return new Unconfigured(PaymentProvider.ESEWA);
    }

    @Bean(name = "khaltiGateway")
    @ConditionalOnMissingBean(name = "khaltiGateway")
    public PaymentGateway unconfiguredKhaltiGateway() {
        return new Unconfigured(PaymentProvider.KHALTI);
    }

    private record Unconfigured(PaymentProvider provider) implements PaymentGateway {

        @Override
        public boolean isConfigured() {
            return false;
        }

        @Override
        public InitiateResult initiate(InitiatePayload payload) {
            return InitiateResult.failed(provider + " is not configured. No checkout was started; "
                    + "a merchant account and credentials are required before online payment can be used.");
        }

        @Override
        public VerifyResult verify(String transactionUuid, BigDecimal expectedAmount) {
            return VerifyResult.notVerified(provider + " is not configured. Nothing was verified.", null);
        }
    }
}
