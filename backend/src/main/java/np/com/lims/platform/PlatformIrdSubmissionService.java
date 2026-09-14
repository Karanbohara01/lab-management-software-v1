package np.com.lims.platform;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import np.com.lims.common.audit.AuditService;
import np.com.lims.common.exception.ApiException;
import np.com.lims.common.web.CurrentUser;
import np.com.lims.ird.entity.IrdStatus;
import np.com.lims.ird.gateway.IrdBillPayload;
import np.com.lims.ird.gateway.IrdGateway;
import np.com.lims.ird.gateway.IrdProperties;
import np.com.lims.platform.dto.PlatformBillingDtos.InvoiceListItem;
import np.com.lims.platform.dto.PlatformBillingDtos.IrdConfigResponse;
import np.com.lims.platform.dto.PlatformBillingDtos.IrdSubmissionDetail;
import np.com.lims.platform.entity.Organization;
import np.com.lims.platform.entity.PlatformIrdSubmission;
import np.com.lims.platform.entity.SubscriptionInvoice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Files a {@link SubscriptionInvoice} — what THIS deployment charges a clinic for its own plan —
 * with IRD/CBMS, reusing the exact same {@link IrdGateway} port that {@code IrdSubmissionService}
 * uses for a clinic's own patient invoices. The gateway is payload-driven with no knowledge of
 * which kind of invoice it's filing, so no new gateway/credential plumbing is needed here — only a
 * new payload builder and a lean tracking row ({@link PlatformIrdSubmission}).
 *
 * <p>Never sets {@code TenantContext}: these are platform-admin-only operations with no
 * organization in scope, so {@code CbmsIrdGateway.resolve()} naturally falls back to this
 * deployment's own shared CBMS credentials ({@link IrdProperties}) — exactly right, since a
 * subscription invoice is this deployment's own sale, not any clinic's.
 */
@Service
public class PlatformIrdSubmissionService {

    private static final String MODULE = "PLATFORM_IRD";

    private final PlatformIrdSubmissionRepository repository;
    private final SubscriptionInvoiceRepository invoiceRepository;
    private final OrganizationRepository organizationRepository;
    private final IrdGateway gateway;
    private final IrdProperties irdProperties;
    private final PlatformIrdCredentialsService credentialsService;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;

    public PlatformIrdSubmissionService(PlatformIrdSubmissionRepository repository,
                                        SubscriptionInvoiceRepository invoiceRepository,
                                        OrganizationRepository organizationRepository,
                                        IrdGateway gateway,
                                        IrdProperties irdProperties,
                                        PlatformIrdCredentialsService credentialsService,
                                        AuditService auditService,
                                        ObjectMapper objectMapper) {
        this.repository = repository;
        this.invoiceRepository = invoiceRepository;
        this.organizationRepository = organizationRepository;
        this.gateway = gateway;
        this.irdProperties = irdProperties;
        this.credentialsService = credentialsService;
        this.auditService = auditService;
        this.objectMapper = objectMapper;
    }

    public IrdConfigResponse config() {
        return new IrdConfigResponse(gateway.isConfigured(), gateway.environment(),
                gateway.isConfigured()
                        ? "A gateway is configured for this deployment's own CBMS account."
                        : "IRD / CBMS e-billing is not configured for this deployment. Subscription "
                        + "invoices can still be recorded as filed manually via the IRD portal.");
    }

    /** Called right after a new subscription invoice is issued — creates the tracking row only, never transmits anything. */
    @Transactional
    public void onSubscriptionInvoiceIssued(SubscriptionInvoice invoice) {
        if (repository.findBySubscriptionInvoiceId(invoice.getId()).isEmpty()) {
            repository.save(PlatformIrdSubmission.trackFor(invoice));
        }
    }

    // ----- queries ------------------------------------------------

    @Transactional(readOnly = true)
    public Page<InvoiceListItem> list(IrdStatus irdStatus, Long organizationId, Pageable pageable) {
        List<SubscriptionInvoice> all = organizationId != null
                ? invoiceRepository.findByOrganizationIdOrderByPeriodStartDesc(organizationId, Pageable.unpaged()).getContent()
                : invoiceRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));

        Map<Long, String> orgNames = organizationRepository.findAllById(
                        all.stream().map(SubscriptionInvoice::getOrganizationId).distinct().toList())
                .stream().collect(Collectors.toMap(Organization::getId, Organization::getName));
        Map<Long, IrdStatus> irdStatuses = repository.findAllFiltered(null).stream()
                .collect(Collectors.toMap(s -> s.getSubscriptionInvoice().getId(), PlatformIrdSubmission::getStatus));

        List<InvoiceListItem> items = all.stream()
                .map(inv -> InvoiceListItem.from(inv, orgNames.get(inv.getOrganizationId()), irdStatuses.get(inv.getId())))
                .filter(item -> irdStatus == null || item.irdStatus() == irdStatus)
                .toList();

        int start = (int) pageable.getOffset();
        if (start >= items.size()) {
            return new PageImpl<>(List.of(), pageable, items.size());
        }
        int end = Math.min(start + pageable.getPageSize(), items.size());
        return new PageImpl<>(items.subList(start, end), pageable, items.size());
    }

    @Transactional(readOnly = true)
    public IrdSubmissionDetail get(Long id) {
        return detailOf(load(id));
    }

    @Transactional(readOnly = true)
    public IrdSubmissionDetail getByInvoice(Long invoiceId) {
        PlatformIrdSubmission s = repository.findBySubscriptionInvoiceId(invoiceId)
                .orElseThrow(() -> ApiException.notFound("IRD submission for subscription invoice", invoiceId));
        return detailOf(s);
    }

    // ----- actions ------------------------------------------------

    @Transactional
    public IrdSubmissionDetail submit(Long id) {
        PlatformIrdSubmission submission = load(id);
        return attempt(submission);
    }

    @Transactional
    public IrdSubmissionDetail retry(Long id) {
        return attempt(load(id));
    }

    @Transactional
    public IrdSubmissionDetail markManual(Long id, String reference, String note) {
        PlatformIrdSubmission submission = load(id);
        submission.recordManual(CurrentUser.username(), reference.trim(), trimToNull(note));
        auditService.record(MODULE, "MANUAL", "PlatformIrdSubmission", id,
                "Recorded manual IRD filing for subscription invoice "
                        + submission.getSubscriptionInvoice().invoiceNumber() + " (ref " + reference + ")",
                null, detailOf(submission));
        return detailOf(submission);
    }

    private IrdSubmissionDetail attempt(PlatformIrdSubmission submission) {
        submission.assertCanSubmit();
        SubscriptionInvoice invoice = submission.getSubscriptionInvoice();
        Organization org = organizationRepository.findById(invoice.getOrganizationId())
                .orElseThrow(() -> ApiException.notFound("Organization", invoice.getOrganizationId()));

        IrdBillPayload payload = buildPayload(invoice, org);
        submission.beginAttempt(toJson(payload));

        IrdGateway.Result result;
        try {
            result = gateway.submit(payload);
        } catch (RuntimeException ex) {
            result = IrdGateway.Result.transportError("GATEWAY_EXCEPTION", ex.getMessage());
        }

        String responseSnapshot = toJson(result.rawResponse());
        switch (result.status()) {
            case ACCEPTED -> submission.recordAccepted(result.providerReference(), responseSnapshot);
            case DUPLICATE -> submission.recordDuplicate(result.providerReference(), responseSnapshot);
            case REJECTED -> submission.recordFailure(result.errorCode(), result.errorMessage(), responseSnapshot);
            case TRANSPORT_ERROR -> submission.recordFailure(result.errorCode(), result.errorMessage(), null);
        }

        auditService.record(MODULE, "SUBMIT", "PlatformIrdSubmission", submission.getId(),
                "IRD submit for subscription invoice " + invoice.invoiceNumber() + " → " + submission.getStatus()
                        + (submission.getLastErrorMessage() == null ? "" : " (" + submission.getLastErrorMessage() + ")"),
                null, detailOf(submission));
        return detailOf(submission);
    }

    private IrdBillPayload buildPayload(SubscriptionInvoice invoice, Organization org) {
        // Display-only fields (see CbmsIrdGateway.resolve(): the actual transmitted seller_pan
        // always comes from whichever credential tier is active, not from this payload) — prefer
        // the platform-admin-configured dashboard credentials, falling back to static config.
        var platformCreds = credentialsService.get();
        String sellerName = StringUtils.hasText(platformCreds.sellerName()) ? platformCreds.sellerName()
                : StringUtils.hasText(irdProperties.sellerName()) ? irdProperties.sellerName() : "LabOS";
        String sellerPan = StringUtils.hasText(platformCreds.sellerPan()) ? platformCreds.sellerPan()
                : irdProperties.sellerPan();
        return new IrdBillPayload(
                invoice.invoiceNumber(),
                fiscalYearOf(invoice),
                invoice.getPeriodStart(),
                sellerName,
                sellerPan,
                org.getName(),
                org.getPan(),
                invoice.getTotalAmount(),
                java.math.BigDecimal.ZERO,
                invoice.getTaxableAmount(),
                invoice.getTaxAmount(),
                invoice.getTotalAmount(),
                List.of(new IrdBillPayload.Line(invoice.getPlanName() + " subscription (" + invoice.invoiceNumber() + ")",
                        1, invoice.getTotalAmount(), invoice.getTotalAmount())));
    }

    /**
     * Nepal's fiscal year runs mid-Shrawan (~mid-July) to mid-Shrawan. Rather than hand-roll an
     * AD->BS year offset (the exact mistake this codebase's own IRD work explicitly avoided
     * elsewhere — see {@code CbmsIrdGateway}'s javadoc — since an inaccurate guess could put a
     * wrong fiscal year on a real government filing), this converts the invoice period start
     * through the same verified {@link np.com.lims.common.calendar.BikramSambatCalendar} the
     * gateway itself uses for the invoice date, then derives the "YYYY.YYY" label from the real
     * BS year (fiscal year N runs from BS month 4 of year N to month 3 of year N+1; a date still
     * in months 1-3 belongs to the fiscal year that started the previous BS year).
     */
    private String fiscalYearOf(SubscriptionInvoice invoice) {
        var bs = np.com.lims.common.calendar.BikramSambatCalendar.toBs(
                invoice.getPeriodStart().atZone(java.time.ZoneId.of("Asia/Kathmandu")).toLocalDate());
        int fiscalStartYear = bs.month() >= 4 ? bs.year() : bs.year() - 1;
        return fiscalStartYear + "." + ((fiscalStartYear + 1) % 1000);
    }

    private IrdSubmissionDetail detailOf(PlatformIrdSubmission s) {
        Organization org = organizationRepository.findById(s.getSubscriptionInvoice().getOrganizationId()).orElse(null);
        return IrdSubmissionDetail.from(s, org == null ? null : org.getName());
    }

    private PlatformIrdSubmission load(Long id) {
        return repository.findDetailedById(id).orElseThrow(() -> ApiException.notFound("IRD submission", id));
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            return null;
        }
    }

    private static String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
