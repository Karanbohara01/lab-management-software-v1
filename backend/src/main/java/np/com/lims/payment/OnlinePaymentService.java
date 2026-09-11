package np.com.lims.payment;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import np.com.lims.billing.InvoiceRepository;
import np.com.lims.billing.entity.Invoice;
import np.com.lims.billing.entity.InvoiceStatus;
import np.com.lims.billing.entity.Payment;
import np.com.lims.billing.entity.PaymentMethod;
import np.com.lims.common.audit.AuditService;
import np.com.lims.common.exception.ApiException;
import np.com.lims.common.web.CurrentUser;
import np.com.lims.payment.dto.PaymentGatewayDtos.InitiateResponse;
import np.com.lims.payment.dto.PaymentGatewayDtos.OnlinePaymentDto;
import np.com.lims.payment.entity.OnlinePayment;
import np.com.lims.payment.entity.PaymentProvider;
import np.com.lims.payment.gateway.PaymentGateway;
import np.com.lims.payment.gateway.PaymentGatewayRegistry;
import np.com.lims.settings.LaboratoryProfileService;
import np.com.lims.settings.entity.LaboratoryProfile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Drives an online checkout end to end. {@link #initiate} starts it; {@link #verify} — called
 * once the gateway redirects the browser back to us — ALWAYS makes its own server-to-server call
 * to the gateway before recording a single rupee (see {@link PaymentGateway#verify}), and only
 * then calls the ordinary {@link Invoice#recordPayment} that a cashier's manual entry would also
 * go through. Billing logic downstream (balance, payment status, refunds) has no idea the money
 * came from a gateway rather than a cashier — it's just a {@code DIGITAL_WALLET} payment.
 */
@Service
public class OnlinePaymentService {

    private static final String MODULE = "ONLINE_PAYMENT";
    private static final Logger log = LoggerFactory.getLogger(OnlinePaymentService.class);

    private final OnlinePaymentRepository repository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentGatewayRegistry registry;
    private final LaboratoryProfileService laboratoryProfileService;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;
    private final String publicUrl;

    public OnlinePaymentService(OnlinePaymentRepository repository,
                                InvoiceRepository invoiceRepository,
                                PaymentGatewayRegistry registry,
                                LaboratoryProfileService laboratoryProfileService,
                                AuditService auditService,
                                ObjectMapper objectMapper,
                                @org.springframework.beans.factory.annotation.Value("${lims.app.public-url}") String publicUrl) {
        this.repository = repository;
        this.invoiceRepository = invoiceRepository;
        this.registry = registry;
        this.laboratoryProfileService = laboratoryProfileService;
        this.auditService = auditService;
        this.objectMapper = objectMapper;
        this.publicUrl = publicUrl;
    }

    @Transactional
    public InitiateResponse initiate(Long invoiceId, PaymentProvider provider) {
        Invoice invoice = invoiceRepository.findDetailedById(invoiceId)
                .orElseThrow(() -> ApiException.notFound("Invoice", invoiceId));
        if (invoice.getStatus() != InvoiceStatus.ISSUED) {
            throw ApiException.conflict("Only an issued invoice can be paid online");
        }
        BigDecimal amount = invoice.balance();
        if (amount.signum() <= 0) {
            throw ApiException.conflict("This invoice has no outstanding balance");
        }

        String transactionUuid = "LIMS-" + invoice.getId() + "-" + UUID.randomUUID().toString().substring(0, 8);
        OnlinePayment onlinePayment = OnlinePayment.initiate(invoice, provider, amount, transactionUuid, CurrentUser.username());
        repository.save(onlinePayment);

        LaboratoryProfile lab = laboratoryProfileService.require();
        String returnBase = trimTrailingSlash(publicUrl) + "/app/invoices/" + invoice.getId();
        PaymentGateway gateway = registry.get(provider);
        PaymentGateway.InitiateResult result = gateway.initiate(new PaymentGateway.InitiatePayload(
                transactionUuid, amount, "Invoice " + (invoice.getInvoiceNumber() == null ? invoice.getId() : invoice.getInvoiceNumber())
                + " — " + lab.getName(),
                returnBase + "?onlinePaymentId=" + onlinePayment.getId() + "&gatewayResult=success",
                returnBase + "?onlinePaymentId=" + onlinePayment.getId() + "&gatewayResult=failure",
                invoice.getPatient().getFullName(), invoice.getPatient().getPhone()));

        onlinePayment.recordInitiateResponse(toJson(result.rawResponse()));
        // Khalti's lookup call needs the pidx it hands back at initiate time, not our own
        // transaction_uuid — capture it now so verify() has the right identifier later.
        if (provider == PaymentProvider.KHALTI && result.success() && result.rawResponse() != null) {
            extractPidx(result.rawResponse()).ifPresent(onlinePayment::recordProviderReference);
        }

        if (!result.success()) {
            onlinePayment.markFailed(result.errorMessage(), result.rawResponse());
            auditService.record(MODULE, "INITIATE_FAILED", "OnlinePayment", onlinePayment.getId(),
                    "Failed to start " + provider + " checkout for invoice " + invoice.getInvoiceNumber()
                            + ": " + result.errorMessage(), null, null);
            throw ApiException.conflict("Unable to start " + provider + " checkout: " + result.errorMessage());
        }

        auditService.record(MODULE, "INITIATE", "OnlinePayment", onlinePayment.getId(),
                "Started " + provider + " checkout for invoice " + invoice.getInvoiceNumber() + ", amount " + amount,
                null, null);

        return new InitiateResponse(onlinePayment.getId(), result.redirectUrl(), result.formAction(), result.formFields());
    }

    @Transactional
    public OnlinePaymentDto verify(Long onlinePaymentId) {
        OnlinePayment onlinePayment = load(onlinePaymentId);
        onlinePayment.assertCanVerify();

        PaymentGateway gateway = registry.get(onlinePayment.getProvider());
        String lookupId = onlinePayment.getProvider() == PaymentProvider.KHALTI && onlinePayment.getProviderReference() != null
                ? onlinePayment.getProviderReference()
                : onlinePayment.getTransactionUuid();

        PaymentGateway.VerifyResult result;
        try {
            result = gateway.verify(lookupId, onlinePayment.getAmount());
        } catch (RuntimeException ex) {
            log.error("Gateway threw while verifying online payment {}", onlinePaymentId, ex);
            result = PaymentGateway.VerifyResult.notVerified(ex.getMessage(), null);
        }

        if (result.verified()) {
            Invoice invoice = onlinePayment.getInvoice();
            String reference = onlinePayment.getProvider() + " " + (result.providerReference() != null ? result.providerReference() : lookupId);
            Payment payment = invoice.recordPayment(onlinePayment.getAmount(), PaymentMethod.DIGITAL_WALLET,
                    reference, "Paid online via " + onlinePayment.getProvider(), "system:" + onlinePayment.getProvider());
            onlinePayment.markVerified(result.providerReference(), payment, toJson(result.rawResponse()));
            auditService.record(MODULE, "VERIFIED", "OnlinePayment", onlinePaymentId,
                    onlinePayment.getProvider() + " payment verified for invoice " + invoice.getInvoiceNumber()
                            + ", amount " + onlinePayment.getAmount(), null, null);
        } else {
            onlinePayment.markFailed(result.errorMessage(), toJson(result.rawResponse()));
            auditService.record(MODULE, "VERIFY_FAILED", "OnlinePayment", onlinePaymentId,
                    onlinePayment.getProvider() + " payment NOT verified: " + result.errorMessage(), null, null);
        }
        return OnlinePaymentDto.from(onlinePayment);
    }

    @Transactional(readOnly = true)
    public List<OnlinePaymentDto> listForInvoice(Long invoiceId) {
        return repository.findByInvoiceIdOrderByInitiatedAtDesc(invoiceId).stream().map(OnlinePaymentDto::from).toList();
    }

    @Transactional(readOnly = true)
    public List<PaymentGatewayRegistry.ProviderStatus> providerStatuses() {
        return registry.statuses();
    }

    private OnlinePayment load(Long id) {
        return repository.findDetailedById(id).orElseThrow(() -> ApiException.notFound("Online payment", id));
    }

    private java.util.Optional<String> extractPidx(String rawJson) {
        try {
            JsonNode node = objectMapper.readTree(rawJson);
            String pidx = node.path("pidx").asText(null);
            return java.util.Optional.ofNullable(pidx);
        } catch (Exception ex) {
            return java.util.Optional.empty();
        }
    }

    private String toJson(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception ex) {
            return null;
        }
    }

    private static String trimTrailingSlash(String url) {
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }
}
