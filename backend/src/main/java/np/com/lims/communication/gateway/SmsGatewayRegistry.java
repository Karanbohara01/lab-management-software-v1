package np.com.lims.communication.gateway;

import np.com.lims.communication.entity.SmsProvider;
import np.com.lims.messaging.gateway.SmsGateway;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * Resolves which SMS provider is actually in effect for the current organization, mirroring
 * {@code np.com.lims.payment.gateway.PaymentGatewayRegistry}'s shape for eSewa/Khalti/Fonepay.
 *
 * <p>Unlike {@code PaymentGateway}, {@code SmsGateway#provider()} returns a free-form,
 * deployment-customizable display label (Sparrow's defaults to {@code "Sparrow SMS"} but can be
 * overridden via {@code lims.sms.provider}) rather than a stable enum — so this registry does not
 * index by that label. Instead it wires the two known {@code SmsGateway} beans directly by their
 * fixed Spring bean names ({@code smsGateway} for Sparrow and {@code samayaGateway} for Samaya —
 * see each gateway's own {@code @Bean} method name, and {@code SamayaSmsGateway}'s javadoc for why
 * that one isn't simply named {@code samayaSmsGateway}), which can't drift just because an
 * organization renames its own provider's display label.
 *
 * <p>Samaya is the preferred/"primary" provider per the Communication Hub's own framing —
 * {@link #effective()} tries Samaya first, falls back to Sparrow (so an organization that already
 * set up Sparrow before this feature existed keeps working unchanged), and if neither is
 * configured, returns Samaya anyway so the caller gets one consistent, honest "not configured"
 * failure rather than having to guess which provider's error to surface.
 */
@Component
public class SmsGatewayRegistry {

    private final Map<SmsProvider, SmsGateway> byProvider;

    public SmsGatewayRegistry(@Qualifier("smsGateway") SmsGateway sparrow,
                               @Qualifier("samayaGateway") SmsGateway samaya) {
        this.byProvider = Map.of(SmsProvider.SPARROW, sparrow, SmsProvider.SAMAYA, samaya);
    }

    public SmsGateway get(SmsProvider provider) {
        SmsGateway gateway = byProvider.get(provider);
        if (gateway == null) {
            throw new IllegalStateException("No gateway registered for provider " + provider);
        }
        return gateway;
    }

    /** The gateway to actually send through right now: Samaya if configured, else Sparrow, else neither (an honest failure). */
    public ResolvedGateway effective() {
        SmsGateway samaya = byProvider.get(SmsProvider.SAMAYA);
        if (samaya.isConfigured()) {
            return new ResolvedGateway(SmsProvider.SAMAYA, samaya);
        }
        SmsGateway sparrow = byProvider.get(SmsProvider.SPARROW);
        if (sparrow.isConfigured()) {
            return new ResolvedGateway(SmsProvider.SPARROW, sparrow);
        }
        return new ResolvedGateway(SmsProvider.SAMAYA, samaya);
    }

    public record ResolvedGateway(SmsProvider provider, SmsGateway gateway) {
    }

    public record ProviderStatus(SmsProvider provider, String label, boolean configured) {
    }

    public List<ProviderStatus> statuses() {
        return List.of(
                new ProviderStatus(SmsProvider.SAMAYA, byProvider.get(SmsProvider.SAMAYA).provider(), byProvider.get(SmsProvider.SAMAYA).isConfigured()),
                new ProviderStatus(SmsProvider.SPARROW, byProvider.get(SmsProvider.SPARROW).provider(), byProvider.get(SmsProvider.SPARROW).isConfigured())
        );
    }
}
