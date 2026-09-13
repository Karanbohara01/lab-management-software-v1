package np.com.lims.messaging;

import np.com.lims.common.audit.AuditService;
import np.com.lims.common.crypto.CryptoService;
import np.com.lims.common.tenant.TenantContext;
import np.com.lims.messaging.dto.WhatsAppCredentialsDtos.Response;
import np.com.lims.messaging.dto.WhatsAppCredentialsDtos.UpdateRequest;
import np.com.lims.messaging.entity.WhatsAppCredentials;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * Each organization's own WhatsApp Business Cloud API credentials — read/write for the settings
 * screen. The real gateway ({@code WhatsAppCloudApiGateway}) reads the repository + decrypts
 * directly rather than through this service, resolving a fallback to this deployment's shared
 * application.yml config when an org hasn't set its own — same split as {@code SmsCredentialsService}.
 */
@Service
public class WhatsAppCredentialsService {

    private static final String MODULE = "SETTINGS";

    private final WhatsAppCredentialsRepository repository;
    private final CryptoService cryptoService;
    private final AuditService auditService;

    public WhatsAppCredentialsService(WhatsAppCredentialsRepository repository, CryptoService cryptoService,
                                      AuditService auditService) {
        this.repository = repository;
        this.cryptoService = cryptoService;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public Response get() {
        return repository.findByOrganizationId(TenantContext.require())
                .map(c -> new Response(c.isWhatsAppEnabled(), c.getPhoneNumberId(), c.getAccessTokenEncrypted() != null))
                .orElseGet(Response::empty);
    }

    @Transactional
    public Response update(UpdateRequest request) {
        Long orgId = TenantContext.require();
        WhatsAppCredentials c = repository.findByOrganizationId(orgId)
                .orElseGet(() -> repository.save(WhatsAppCredentials.createFor(orgId)));

        String tokenEnc = StringUtils.hasText(request.accessToken()) ? cryptoService.encrypt(request.accessToken().trim()) : null;
        c.update(request.enabled(), trimToNull(request.phoneNumberId()), tokenEnc);

        // Never write the actual access token to the audit trail — before/after are intentionally null.
        auditService.record(MODULE, "UPDATE_WHATSAPP_CREDENTIALS", "WhatsAppCredentials", c.getId(),
                "Updated WhatsApp credentials (enabled " + request.enabled() + ")", null, null);
        return get();
    }

    private static String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
