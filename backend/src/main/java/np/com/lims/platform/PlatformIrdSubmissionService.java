package np.com.lims.platform;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import np.com.lims.common.audit.AuditService;
import np.com.lims.common.exception.ApiException;
import np.com.lims.common.sequence.SequenceService;
import np.com.lims.common.web.CurrentUser;
import np.com.lims.ird.entity.IrdStatus;
import np.com.lims.ird.gateway.IrdBillPayload;
import np.com.lims.ird.gateway.IrdCreditNotePayload;
import np.com.lims.ird.gateway.IrdGateway;
import np.com.lims.ird.gateway.IrdProperties;
import np.com.lims.platform.dto.PlatformBillingDtos.InvoiceListItem;
import np.com.lims.platform.dto.PlatformBillingDtos.IrdConfigResponse;
import np.com.lims.platform.dto.PlatformBillingDtos.IrdSubmissionDetail;
import np.com.lims.platform.entity.Organization;
import np.com.lims.platform.entity.PlatformIrdSubmission;
import np.com.lims.platform.entity.SubscriptionInvoice;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Duration;
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
    private static final Logger log = LoggerFactory.getLogger(PlatformIrdSubmissionService.class);

    /** Auto-retry sweep tuning — same shape as IrdSubmissionService's identical constants. */
    private static final int MAX_AUTO_RETRY_ATTEMPTS = 5;
    private static final Duration AUTO_RETRY_BACKOFF = Duration.ofMinutes(5);

    private final PlatformIrdSubmissionRepository repository;
    private final SubscriptionInvoiceRepository invoiceRepository;
    private final OrganizationRepository organizationRepository;
    private final IrdGateway gateway;
    private final IrdProperties irdProperties;
    private final PlatformIrdCredentialsService credentialsService;
    private final SequenceService sequenceService;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;

    public PlatformIrdSubmissionService(PlatformIrdSubmissionRepository repository,
                                        SubscriptionInvoiceRepository invoiceRepository,
                                        OrganizationRepository organizationRepository,
                                        IrdGateway gateway,
                                        IrdProperties irdProperties,
                                        PlatformIrdCredentialsService credentialsService,
                                        SequenceService sequenceService,
                                        AuditService auditService,
                                        ObjectMapper objectMapper) {
        this.repository = repository;
        this.invoiceRepository = invoiceRepository;
        this.organizationRepository = organizationRepository;
        this.gateway = gateway;
        this.irdProperties = irdProperties;
        this.credentialsService = credentialsService;
        this.sequenceService = sequenceService;
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

    /**
     * Runs every 10 minutes, unattended. Only ever retries a submission whose last failure never
     * reached CBMS (a network/timeout/gateway-misconfiguration problem this server can recover
     * from on its own) — never one IRD itself rejected, which needs a human to fix data or
     * credentials. Caps total attempts and enforces a minimum backoff so a prolonged outage
     * produces occasional retries, not a tight retry storm every sweep tick.
     */
    @Scheduled(cron = "${lims.ird.retry-cron:0 */10 * * * *}")
    @Transactional
    public int autoRetrySweep() {
        int retried = 0;
        if (!gateway.isConfigured()) {
            return 0;
        }
        for (PlatformIrdSubmission submission : repository.findAllFiltered(IrdStatus.FAILED)) {
            if (!submission.isAutoRetryEligible(MAX_AUTO_RETRY_ATTEMPTS, AUTO_RETRY_BACKOFF, submission.getUpdatedAt())) {
                continue;
            }
            try {
                attempt(submission);
                retried++;
            } catch (RuntimeException ex) {
                log.warn("Platform IRD auto-retry errored for submission {} (invoice {}): {}",
                        submission.getId(), submission.getSubscriptionInvoice().invoiceNumber(), ex.toString());
            }
        }
        if (retried > 0) {
            log.info("Platform IRD auto-retry sweep: retried {} previously-failed submission(s)", retried);
        }
        return retried;
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
        Map<Long, PlatformIrdSubmission> submissions = repository.findAllFiltered(null).stream()
                .collect(Collectors.toMap(s -> s.getSubscriptionInvoice().getId(), s -> s));

        List<InvoiceListItem> items = all.stream()
                .map(inv -> InvoiceListItem.from(inv, orgNames.get(inv.getOrganizationId()), submissions.get(inv.getId())))
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

    /**
     * Cancel a not-yet-paid subscription invoice — e.g. issued in error, or a negotiated waiver.
     * If it was never filed with IRD, the tracking row is simply marked cancelled; if it WAS
     * filed (ACCEPTED/DUPLICATE), a credit note is flagged as needed instead — filing it is a
     * separate, explicit action ({@link #submitCreditNote}), never automatic here.
     */
    @Transactional
    public IrdSubmissionDetail cancelInvoice(Long invoiceId, String reason) {
        SubscriptionInvoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> ApiException.notFound("Subscription invoice", invoiceId));
        invoice.assertCanCancel();
        invoice.cancel(reason.trim());
        invoiceRepository.save(invoice);

        PlatformIrdSubmission submission = repository.findBySubscriptionInvoiceId(invoiceId)
                .orElseThrow(() -> ApiException.notFound("IRD submission for subscription invoice", invoiceId));
        submission.cancel();

        auditService.record(MODULE, "CANCEL_INVOICE", "SubscriptionInvoice", invoiceId,
                "Cancelled subscription invoice " + invoice.invoiceNumber() + " — " + reason
                        + (submission.getCreditNoteStatus().name().equals("NEEDED") ? " (credit note now needed)" : ""),
                null, detailOf(submission));
        return detailOf(submission);
    }

    @Transactional
    public IrdSubmissionDetail submitCreditNote(Long id) {
        return attemptCreditNote(load(id));
    }

    @Transactional
    public IrdSubmissionDetail retryCreditNote(Long id) {
        return attemptCreditNote(load(id));
    }

    @Transactional
    public IrdSubmissionDetail markCreditNoteManual(Long id, String reference, String note) {
        PlatformIrdSubmission submission = load(id);
        submission.recordCreditNoteManual(reference.trim(), trimToNull(note));
        auditService.record(MODULE, "CREDIT_NOTE_MANUAL", "PlatformIrdSubmission", id,
                "Recorded manual credit note filing for subscription invoice "
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
            case REJECTED -> submission.recordFailure(true, result.errorCode(), result.errorMessage(), responseSnapshot);
            case TRANSPORT_ERROR -> submission.recordFailure(false, result.errorCode(), result.errorMessage(), null);
        }

        auditService.record(MODULE, "SUBMIT", "PlatformIrdSubmission", submission.getId(),
                "IRD submit for subscription invoice " + invoice.invoiceNumber() + " → " + submission.getStatus()
                        + (submission.getLastErrorMessage() == null ? "" : " (" + submission.getLastErrorMessage() + ")"),
                null, detailOf(submission));
        return detailOf(submission);
    }

    private IrdSubmissionDetail attemptCreditNote(PlatformIrdSubmission submission) {
        submission.assertCanSubmitCreditNote();
        SubscriptionInvoice invoice = submission.getSubscriptionInvoice();
        Organization org = organizationRepository.findById(invoice.getOrganizationId())
                .orElseThrow(() -> ApiException.notFound("Organization", invoice.getOrganizationId()));

        String creditNoteNumber = submission.getCreditNoteNumber() != null
                ? submission.getCreditNoteNumber()
                : "SUBCN-%s-%06d".formatted(fiscalYearOf(invoice),
                        sequenceService.nextOrCreate("PLATFORM_IRD_CREDIT_NOTE:" + fiscalYearOf(invoice)));

        IrdCreditNotePayload payload = buildCreditNotePayload(invoice, org, creditNoteNumber);
        submission.beginCreditNoteAttempt();

        IrdGateway.Result result;
        try {
            result = gateway.submitCreditNote(payload);
        } catch (RuntimeException ex) {
            result = IrdGateway.Result.transportError("GATEWAY_EXCEPTION", ex.getMessage());
        }

        switch (result.status()) {
            case ACCEPTED, DUPLICATE -> submission.recordCreditNoteFiled(creditNoteNumber, result.providerReference());
            case REJECTED, TRANSPORT_ERROR -> submission.recordCreditNoteFailed(result.errorCode(), result.errorMessage());
        }

        auditService.record(MODULE, "CREDIT_NOTE", "PlatformIrdSubmission", submission.getId(),
                "IRD credit note for subscription invoice " + invoice.invoiceNumber() + " → " + submission.getCreditNoteStatus()
                        + (submission.getCreditNoteErrorMessage() == null ? "" : " (" + submission.getCreditNoteErrorMessage() + ")"),
                null, detailOf(submission));
        return detailOf(submission);
    }

    private IrdCreditNotePayload buildCreditNotePayload(SubscriptionInvoice invoice, Organization org, String creditNoteNumber) {
        var platformCreds = credentialsService.get();
        String sellerName = StringUtils.hasText(platformCreds.sellerName()) ? platformCreds.sellerName()
                : StringUtils.hasText(irdProperties.sellerName()) ? irdProperties.sellerName() : "LabOS";
        String sellerPan = StringUtils.hasText(platformCreds.sellerPan()) ? platformCreds.sellerPan() : irdProperties.sellerPan();
        return new IrdCreditNotePayload(
                invoice.invoiceNumber(),
                creditNoteNumber,
                java.time.Instant.now(),
                invoice.getCancelReason() == null ? "Subscription invoice cancelled" : invoice.getCancelReason(),
                fiscalYearOf(invoice),
                sellerName,
                sellerPan,
                org.getName(),
                org.getPan(),
                invoice.getTotalAmount(),
                java.math.BigDecimal.ZERO,
                invoice.getTaxableAmount(),
                invoice.getTaxAmount(),
                invoice.getTotalAmount());
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
