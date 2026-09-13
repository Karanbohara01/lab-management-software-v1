package np.com.lims.payment.gateway;

import np.com.lims.payment.entity.PaymentProvider;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;

/**
 * A safety-net default: if {@code EsewaGatewayConfig}/{@code KhaltiGatewayConfig} were ever
 * conditionally disabled again (they currently always register — see those classes, which now
 * resolve "configured or not" dynamically per organization/request rather than at bean-creation
 * time), this bean would take over and transmit nothing, returning a clear, honest "not
 * configured" error for every call. Currently dormant in practice (its
 * {@code @ConditionalOnMissingBean} never triggers), kept as the fallback of last resort.
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
