package np.com.lims.communication;

import np.com.lims.common.audit.AuditService;
import np.com.lims.common.crypto.CryptoService;
import np.com.lims.common.exception.ApiException;
import np.com.lims.common.exception.ErrorCode;
import np.com.lims.common.tenant.TenantContext;
import np.com.lims.common.web.CurrentUser;
import np.com.lims.communication.dto.CommunicationDtos.BalanceResponse;
import np.com.lims.communication.dto.CommunicationDtos.GatewayStatusResponse;
import np.com.lims.communication.dto.CommunicationDtos.SamayaConfigRequest;
import np.com.lims.communication.dto.CommunicationDtos.SamayaConfigResponse;
import np.com.lims.communication.dto.CommunicationDtos.SendSmsResponse;
import np.com.lims.communication.entity.SmsCategory;
import np.com.lims.communication.entity.SmsMessageStatus;
import np.com.lims.communication.entity.SmsProvider;
import np.com.lims.communication.gateway.BalanceCheckableGateway;
import np.com.lims.communication.gateway.SmsGatewayRegistry;
import np.com.lims.messaging.SmsCredentialsRepository;
import np.com.lims.messaging.entity.SmsCredentials;
import np.com.lims.messaging.gateway.SmsGateway;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

/**
 * This organization's own Samaya SMS account, plus the test-send / balance-check / gateway-status
 * views the Communication Hub's "SMS Configuration" screen needs — the Samaya-specific sibling of
 * {@code SmsCredentialsService} (which stays Sparrow-only, untouched). Lives in the
 * {@code communication} package rather than {@code messaging} since it is Communication Hub
 * surface area, not part of the original messaging integration.
 */
@Service
public class SmsConfigService {

    private static final String MODULE = "COMMUNICATION";

    private final SmsCredentialsRepository credentialsRepository;
    private final CryptoService cryptoService;
    private final AuditService auditService;
    private final SmsGatewayRegistry gatewayRegistry;
    private final SmsMessageService messageService;

    public SmsConfigService(SmsCredentialsRepository credentialsRepository, CryptoService cryptoService,
                            AuditService auditService, SmsGatewayRegistry gatewayRegistry,
                            SmsMessageService messageService) {
        this.credentialsRepository = credentialsRepository;
        this.cryptoService = cryptoService;
        this.auditService = auditService;
        this.gatewayRegistry = gatewayRegistry;
        this.messageService = messageService;
    }

    @Transactional(readOnly = true)
    public SamayaConfigResponse getSamaya() {
        return credentialsRepository.findByOrganizationId(TenantContext.require())
                .map(c -> new SamayaConfigResponse(c.isSamayaEnabled(), c.getSamayaBaseUrl(), c.getSamayaSenderId(),
                        c.getSamayaApiKeyEncrypted() != null))
                .orElseGet(SamayaConfigResponse::empty);
    }

    @Transactional
    public SamayaConfigResponse updateSamaya(SamayaConfigRequest request) {
        Long orgId = TenantContext.require();
        SmsCredentials c = credentialsRepository.findByOrganizationId(orgId)
                .orElseGet(() -> credentialsRepository.save(SmsCredentials.createFor(orgId)));

        String keyEnc = StringUtils.hasText(request.apiKey()) ? cryptoService.encrypt(request.apiKey().trim()) : null;
        c.updateSamaya(request.enabled(), trimToNull(request.baseUrl()), trimToNull(request.senderId()), keyEnc);

        // Never write the actual API key to the audit trail.
        auditService.record(MODULE, "UPDATE_SAMAYA_CONFIG", "SmsCredentials", c.getId(),
                "Updated Samaya SMS configuration (enabled " + request.enabled() + ")", null, null);
        return getSamaya();
    }

    @Transactional(readOnly = true)
    public Integer getLowBalanceThreshold() {
        return credentialsRepository.findByOrganizationId(TenantContext.require())
                .map(SmsCredentials::getLowBalanceThreshold).orElse(null);
    }

    @Transactional
    public Integer updateLowBalanceThreshold(Integer threshold) {
        Long orgId = TenantContext.require();
        SmsCredentials c = credentialsRepository.findByOrganizationId(orgId)
                .orElseGet(() -> credentialsRepository.save(SmsCredentials.createFor(orgId)));
        c.updateLowBalanceThreshold(threshold);
        auditService.record(MODULE, "UPDATE_LOW_BALANCE_THRESHOLD", "SmsCredentials", c.getId(),
                "Set the SMS low-balance alert threshold to " + (threshold == null ? "disabled" : threshold),
                null, null);
        return threshold;
    }

    @Transactional(readOnly = true)
    public List<GatewayStatusResponse> statuses() {
        return gatewayRegistry.statuses().stream()
                .map(s -> new GatewayStatusResponse(s.provider(), s.label(), s.configured()))
                .toList();
    }

    @Transactional(readOnly = true)
    public BalanceResponse balance(SmsProvider provider) {
        SmsGateway gateway = gatewayRegistry.get(provider);
        if (!(gateway instanceof BalanceCheckableGateway balanceCheckable)) {
            return new BalanceResponse(false, null, null,
                    "This provider does not publish a balance-check call this system has been able to confirm.");
        }
        var result = balanceCheckable.checkBalance();
        return new BalanceResponse(result.available(), result.balance(), result.rawResponse(), result.errorMessage());
    }

    @Transactional
    public SendSmsResponse sendTest(SmsProvider provider, String phone) {
        if (!NepaliPhoneValidator.isValidMobile(phone)) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "\"" + phone + "\" does not look like a Nepali mobile number.");
        }
        SmsGateway gateway = gatewayRegistry.get(provider);
        if (!gateway.isConfigured()) {
            throw new ApiException(ErrorCode.EXTERNAL_SERVICE_UNAVAILABLE,
                    gateway.provider() + " is not configured for this organization.");
        }
        var message = messageService.send(SmsMessageService.SendCommand.test(phone, SmsCategory.CUSTOM,
                "This is a test message from LabOS to confirm your SMS gateway is working.",
                CurrentUser.username(), provider));
        boolean sent = message.getStatus() == SmsMessageStatus.SENT || message.getStatus() == SmsMessageStatus.DELIVERED;
        return new SendSmsResponse(sent, SmsSendService.toResponse(message), sent ? null : message.getErrorMessage());
    }

    private static String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
