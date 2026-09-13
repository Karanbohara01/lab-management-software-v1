package np.com.lims.ird;

import np.com.lims.common.audit.AuditService;
import np.com.lims.common.crypto.CryptoService;
import np.com.lims.common.tenant.TenantContext;
import np.com.lims.ird.dto.IrdCredentialsDtos.Response;
import np.com.lims.ird.dto.IrdCredentialsDtos.UpdateRequest;
import np.com.lims.ird.entity.IrdCredentials;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * Each organization's own IRD/CBMS credentials — read/write for the settings screen. The real
 * gateway ({@code CbmsIrdGateway}) reads the repository + decrypts directly rather than through
 * this service, resolving a fallback to this deployment's shared application.yml config when an
 * org hasn't set its own — same split as {@code np.com.lims.payment.PaymentCredentialsService}.
 */
@Service
public class IrdCredentialsService {

    private static final String MODULE = "SETTINGS";

    private final IrdCredentialsRepository repository;
    private final CryptoService cryptoService;
    private final AuditService auditService;

    public IrdCredentialsService(IrdCredentialsRepository repository, CryptoService cryptoService,
                                 AuditService auditService) {
        this.repository = repository;
        this.cryptoService = cryptoService;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public Response get() {
        return repository.findByOrganizationId(TenantContext.require())
                .map(c -> new Response(c.isIrdEnabled(), c.getIrdUsername(), c.getIrdSellerPan(),
                        c.getIrdPasswordEncrypted() != null))
                .orElseGet(Response::empty);
    }

    @Transactional
    public Response update(UpdateRequest request) {
        Long orgId = TenantContext.require();
        IrdCredentials c = repository.findByOrganizationId(orgId)
                .orElseGet(() -> repository.save(IrdCredentials.createFor(orgId)));

        String passwordEnc = StringUtils.hasText(request.password())
                ? cryptoService.encrypt(request.password().trim()) : null;
        c.update(request.enabled(), trimToNull(request.username()), trimToNull(request.sellerPan()), passwordEnc);

        // Never write the actual password to the audit trail — before/after are intentionally null.
        auditService.record(MODULE, "UPDATE_IRD_CREDENTIALS", "IrdCredentials", c.getId(),
                "Updated IRD credentials (enabled " + request.enabled() + ")", null, null);
        return get();
    }

    private static String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
