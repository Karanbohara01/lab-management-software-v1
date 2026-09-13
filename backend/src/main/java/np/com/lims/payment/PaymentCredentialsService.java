package np.com.lims.payment;

import np.com.lims.common.audit.AuditService;
import np.com.lims.common.crypto.CryptoService;
import np.com.lims.common.tenant.TenantContext;
import np.com.lims.payment.dto.PaymentCredentialsDtos.Response;
import np.com.lims.payment.dto.PaymentCredentialsDtos.UpdateRequest;
import np.com.lims.payment.entity.PaymentCredentials;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * Each organization's own eSewa/Khalti credentials — read/write for the settings screen. The
 * gateways themselves (EsewaGatewayConfig/KhaltiGatewayConfig) read the repository + decrypt
 * directly rather than through this service, since they need the raw secret to call the gateway
 * and a fallback to this deployment's shared application.yml config when an org hasn't set its
 * own — a different concern than this CRUD-for-a-settings-screen service.
 */
@Service
public class PaymentCredentialsService {

    private static final String MODULE = "SETTINGS";

    private final PaymentCredentialsRepository repository;
    private final CryptoService cryptoService;
    private final AuditService auditService;

    public PaymentCredentialsService(PaymentCredentialsRepository repository, CryptoService cryptoService,
                                     AuditService auditService) {
        this.repository = repository;
        this.cryptoService = cryptoService;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public Response get() {
        return repository.findByOrganizationId(TenantContext.require())
                .map(c -> new Response(c.isEsewaEnabled(), c.getEsewaMerchantCode(), c.getEsewaSecretKeyEncrypted() != null,
                        c.isKhaltiEnabled(), c.getKhaltiSecretKeyEncrypted() != null))
                .orElseGet(Response::empty);
    }

    @Transactional
    public Response update(UpdateRequest request) {
        Long orgId = TenantContext.require();
        PaymentCredentials c = repository.findByOrganizationId(orgId)
                .orElseGet(() -> repository.save(PaymentCredentials.createFor(orgId)));

        String esewaSecretEnc = StringUtils.hasText(request.esewaSecretKey())
                ? cryptoService.encrypt(request.esewaSecretKey().trim()) : null;
        c.updateEsewa(request.esewaEnabled(), trimToNull(request.esewaMerchantCode()), esewaSecretEnc);

        String khaltiSecretEnc = StringUtils.hasText(request.khaltiSecretKey())
                ? cryptoService.encrypt(request.khaltiSecretKey().trim()) : null;
        c.updateKhalti(request.khaltiEnabled(), khaltiSecretEnc);

        // Never write actual secret values to the audit trail — before/after are intentionally null.
        auditService.record(MODULE, "UPDATE_PAYMENT_CREDENTIALS", "PaymentCredentials", c.getId(),
                "Updated payment gateway credentials (esewa " + (request.esewaEnabled() ? "on" : "off")
                        + ", khalti " + (request.khaltiEnabled() ? "on" : "off") + ")", null, null);
        return get();
    }

    private static String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
