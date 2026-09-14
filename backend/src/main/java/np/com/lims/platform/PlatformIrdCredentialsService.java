package np.com.lims.platform;

import np.com.lims.common.audit.AuditService;
import np.com.lims.common.crypto.CryptoService;
import np.com.lims.platform.dto.PlatformBillingDtos.IrdCredentialsResponse;
import np.com.lims.platform.dto.PlatformBillingDtos.IrdCredentialsUpdateRequest;
import np.com.lims.platform.entity.PlatformIrdCredentials;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * This deployment's own shared CBMS taxpayer login (edit/read for the platform admin dashboard).
 * {@code CbmsIrdGateway} reads the repository and decrypts directly, same split as {@code
 * IrdCredentialsService}/{@code PaymentCredentialsService}.
 */
@Service
public class PlatformIrdCredentialsService {

    private static final String MODULE = "PLATFORM_IRD";

    private final PlatformIrdCredentialsRepository repository;
    private final CryptoService cryptoService;
    private final AuditService auditService;

    public PlatformIrdCredentialsService(PlatformIrdCredentialsRepository repository, CryptoService cryptoService,
                                         AuditService auditService) {
        this.repository = repository;
        this.cryptoService = cryptoService;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public IrdCredentialsResponse get() {
        return repository.findSingleton()
                .map(c -> new IrdCredentialsResponse(c.isIrdEnabled(), c.getIrdUsername(), c.getIrdSellerPan(),
                        c.getIrdSellerName(), c.getIrdPasswordEncrypted() != null))
                .orElseGet(IrdCredentialsResponse::empty);
    }

    @Transactional
    public IrdCredentialsResponse update(IrdCredentialsUpdateRequest request) {
        PlatformIrdCredentials c = repository.findSingleton()
                .orElseGet(() -> repository.save(PlatformIrdCredentials.createEmpty()));

        String passwordEnc = StringUtils.hasText(request.password())
                ? cryptoService.encrypt(request.password().trim()) : null;
        c.update(request.enabled(), trimToNull(request.username()), trimToNull(request.sellerPan()),
                trimToNull(request.sellerName()), passwordEnc);

        // Never write the actual password to the audit trail — before/after are intentionally null.
        auditService.record(MODULE, "UPDATE_IRD_CREDENTIALS", "PlatformIrdCredentials", c.getId(),
                "Updated this deployment's shared IRD credentials (enabled " + request.enabled() + ")", null, null);
        return get();
    }

    private static String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
