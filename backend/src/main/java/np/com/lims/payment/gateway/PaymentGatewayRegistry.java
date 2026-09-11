package np.com.lims.payment.gateway;

import np.com.lims.payment.entity.PaymentProvider;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/** Resolves the active {@link PaymentGateway} bean for a given provider (Spring autowires every candidate bean here). */
@Component
public class PaymentGatewayRegistry {

    private final Map<PaymentProvider, PaymentGateway> byProvider;

    public PaymentGatewayRegistry(List<PaymentGateway> gateways) {
        this.byProvider = gateways.stream().collect(Collectors.toMap(PaymentGateway::provider, Function.identity()));
    }

    public PaymentGateway get(PaymentProvider provider) {
        PaymentGateway gateway = byProvider.get(provider);
        if (gateway == null) {
            throw new IllegalStateException("No gateway registered for provider " + provider);
        }
        return gateway;
    }

    public List<ProviderStatus> statuses() {
        return byProvider.values().stream()
                .map(g -> new ProviderStatus(g.provider(), g.isConfigured()))
                .sorted((a, b) -> a.provider().compareTo(b.provider()))
                .toList();
    }

    public record ProviderStatus(PaymentProvider provider, boolean configured) {
    }
}
