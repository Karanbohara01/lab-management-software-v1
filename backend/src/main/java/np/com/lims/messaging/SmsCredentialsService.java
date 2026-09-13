package np.com.lims.messaging;

import np.com.lims.common.audit.AuditService;
import np.com.lims.common.crypto.CryptoService;
import np.com.lims.common.tenant.TenantContext;
import np.com.lims.messaging.dto.SmsCredentialsDtos.Response;
import np.com.lims.messaging.dto.SmsCredentialsDtos.UpdateRequest;
import np.com.lims.messaging.entity.SmsCredentials;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * Each organization's own Sparrow SMS account — read/write for the settings screen. The real
 * gateway ({@code SparrowSmsGateway}) reads the repository + decrypts directly rather than
 * through this service, resolving a fallback to this deployment's shared application.yml config
 * when an org hasn't set its own — same split as {@code IrdCredentialsService}.
 */
@Service
public class SmsCredentialsService {

    private static final String MODULE = "SETTINGS";

    private final SmsCredentialsRepository repository;
    private final CryptoService cryptoService;
    private final AuditService auditService;

    public SmsCredentialsService(SmsCredentialsRepository repository, CryptoService cryptoService,
                                 AuditService auditService) {
        this.repository = repository;
        this.cryptoService = cryptoService;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public Response get() {
        return repository.findByOrganizationId(TenantContext.require())
                .map(c -> new Response(c.isSmsEnabled(), c.getSmsFrom(), c.getSmsTokenEncrypted() != null))
                .orElseGet(Response::empty);
    }

    @Transactional
    public Response update(UpdateRequest request) {
        Long orgId = TenantContext.require();
        SmsCredentials c = repository.findByOrganizationId(orgId)
                .orElseGet(() -> repository.save(SmsCredentials.createFor(orgId)));

        String tokenEnc = StringUtils.hasText(request.token()) ? cryptoService.encrypt(request.token().trim()) : null;
        c.update(request.enabled(), trimToNull(request.from()), tokenEnc);

        // Never write the actual token to the audit trail — before/after are intentionally null.
        auditService.record(MODULE, "UPDATE_SMS_CREDENTIALS", "SmsCredentials", c.getId(),
                "Updated SMS credentials (enabled " + request.enabled() + ")", null, null);
        return get();
    }

    private static String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
