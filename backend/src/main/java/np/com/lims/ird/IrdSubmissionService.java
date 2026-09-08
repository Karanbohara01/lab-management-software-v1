package np.com.lims.ird;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import np.com.lims.billing.entity.Invoice;
import np.com.lims.billing.entity.InvoiceItem;
import np.com.lims.billing.entity.InvoiceStatus;
import np.com.lims.common.audit.AuditService;
import np.com.lims.common.exception.ApiException;
import np.com.lims.common.web.CurrentUser;
import np.com.lims.ird.dto.IrdDtos.ConfigResponse;
import np.com.lims.ird.dto.IrdDtos.Detail;
import np.com.lims.ird.dto.IrdDtos.ListItem;
import np.com.lims.ird.dto.IrdDtos.Summary;
import np.com.lims.ird.entity.IrdStatus;
import np.com.lims.ird.entity.IrdSubmission;
import np.com.lims.ird.entity.IrdSubmissionAttempt;
import np.com.lims.ird.gateway.IrdBillPayload;
import np.com.lims.ird.gateway.IrdGateway;
import np.com.lims.notification.NotificationService;
import np.com.lims.notification.entity.Notification;
import np.com.lims.settings.LaboratoryProfileService;
import np.com.lims.settings.entity.LaboratoryProfile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.Map;
import java.util.TreeMap;

@Service
public class IrdSubmissionService {

    private static final String MODULE = "IRD";
    private static final Logger log = LoggerFactory.getLogger(IrdSubmissionService.class);

    private final IrdSubmissionRepository repository;
    private final IrdGateway gateway;
    private final LaboratoryProfileService laboratoryProfileService;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;
    private final NotificationService notificationService;

    public IrdSubmissionService(IrdSubmissionRepository repository,
                                IrdGateway gateway,
                                LaboratoryProfileService laboratoryProfileService,
                                AuditService auditService,
                                ObjectMapper objectMapper,
                                NotificationService notificationService) {
        this.repository = repository;
        this.gateway = gateway;
        this.laboratoryProfileService = laboratoryProfileService;
        this.auditService = auditService;
        this.objectMapper = objectMapper;
        this.notificationService = notificationService;
    }

    public ConfigResponse config() {
        return new ConfigResponse(
                gateway.isConfigured(),
                gateway.environment(),
                false,
                gateway.isConfigured()
                        ? "A gateway is configured. This does not by itself constitute official IRD registration."
                        : "IRD / CBMS e-billing is not configured. This system is not IRD-registered and transmits "
                        + "nothing. Bills can still be recorded as filed manually via the IRD portal.");
    }

    // ----- lifecycle hooks from billing ----------------------------

    @Transactional
    public void onInvoiceIssued(Invoice invoice) {
        if (!repository.existsByInvoiceId(invoice.getId())) {
            repository.save(IrdSubmission.trackFor(invoice));
        }
    }

    @Transactional
    public void onInvoiceCancelled(Invoice invoice) {
        repository.findByInvoiceId(invoice.getId()).ifPresent(submission -> {
            if (!submission.getStatus().isTerminalSuccess()) {
                submission.cancel("system", "Invoice was cancelled");
            }
        });
    }

    // ----- queries ------------------------------------------------

    @Transactional(readOnly = true)
    public Page<ListItem> search(IrdStatus status, String query, Pageable pageable) {
        String normalized = StringUtils.hasText(query) ? query.trim() : null;
        return repository.search(status, normalized, pageable).map(ListItem::from);
    }

    @Transactional(readOnly = true)
    public Detail get(Long id) {
        return Detail.from(load(id));
    }

    @Transactional(readOnly = true)
    public Detail getByInvoice(Long invoiceId) {
        return Detail.from(repository.findByInvoiceId(invoiceId)
                .orElseThrow(() -> ApiException.notFound("IRD submission for invoice", invoiceId)));
    }

    @Transactional(readOnly = true)
    public Summary summary() {
        Map<String, Long> counts = new TreeMap<>();
        for (IrdStatus status : IrdStatus.values()) {
            counts.put(status.name(), 0L);
        }
        repository.countByStatus().forEach(row -> counts.put(row.getStatus().name(), row.getCount()));
        return new Summary(counts);
    }

    // ----- actions ----------------------------------------------

    @Transactional
    public Detail submitByInvoice(Long invoiceId) {
        IrdSubmission submission = repository.findByInvoiceId(invoiceId)
                .orElseThrow(() -> ApiException.notFound("IRD submission for invoice", invoiceId));
        return attempt(submission, IrdSubmissionAttempt.Action.SUBMIT);
    }

    @Transactional
    public Detail retry(Long id) {
        IrdSubmission submission = load(id);
        return attempt(submission, IrdSubmissionAttempt.Action.RETRY);
    }

    @Transactional
    public Detail markManual(Long id, String reference, String note) {
        IrdSubmission submission = load(id);
        submission.recordManual(CurrentUser.username(), reference.trim(), trimToNull(note));
        auditService.record(MODULE, "MANUAL", "IrdSubmission", id,
                "Recorded manual IRD filing for invoice " + submission.getInvoice().getInvoiceNumber()
                        + " (ref " + reference + ")", null, Detail.from(submission));
        return Detail.from(submission);
    }

    @Transactional
    public Detail cancel(Long id, String reason) {
        IrdSubmission submission = load(id);
        submission.cancel(CurrentUser.username(), reason.trim());
        auditService.record(MODULE, "CANCEL", "IrdSubmission", id,
                "Cancelled IRD submission for invoice " + submission.getInvoice().getInvoiceNumber(),
                null, Detail.from(submission));
        return Detail.from(submission);
    }

    // ----- core ------------------------------------------------

    private Detail attempt(IrdSubmission submission, IrdSubmissionAttempt.Action action) {
        submission.assertCanSubmit();
        Invoice invoice = submission.getInvoice();
        if (invoice.getStatus() != InvoiceStatus.ISSUED) {
            throw ApiException.conflict("Only an issued invoice can be submitted to IRD");
        }

        IrdBillPayload payload = buildPayload(invoice);
        IrdSubmissionAttempt attempt = submission.beginAttempt(action, CurrentUser.username(), toJson(payload));

        IrdGateway.Result result;
        try {
            result = gateway.submit(payload);
        } catch (RuntimeException ex) {
            log.error("IRD gateway threw while submitting invoice {}", invoice.getInvoiceNumber(), ex);
            result = IrdGateway.Result.transportError("GATEWAY_EXCEPTION", ex.getMessage());
        }

        switch (result.status()) {
            case ACCEPTED -> submission.recordAccepted(attempt, result.providerReference(), result.rawResponse());
            case DUPLICATE -> submission.recordDuplicate(attempt, result.providerReference(), result.rawResponse());
            case REJECTED -> submission.recordFailure(attempt, true, result.errorCode(), result.errorMessage(),
                    result.rawResponse());
            case TRANSPORT_ERROR -> submission.recordFailure(attempt, false, result.errorCode(),
                    result.errorMessage(), null);
        }

        auditService.record(MODULE, action.name(), "IrdSubmission", submission.getId(),
                "IRD " + action + " for invoice " + invoice.getInvoiceNumber() + " → " + submission.getStatus()
                        + (submission.getLastErrorMessage() == null ? "" : " (" + submission.getLastErrorMessage() + ")"),
                null, Detail.from(submission));

        if (submission.getStatus() == IrdStatus.FAILED) {
            notificationService.publish(Notification.Type.IRD_FAILED, Notification.Severity.WARNING,
                    "IRD submission failed",
                    "Invoice " + invoice.getInvoiceNumber() + " — " + submission.getLastErrorMessage(),
                    "/ird/" + submission.getId(), "IRD_SUBMISSION_READ",
                    "ird:" + submission.getId() + ":" + submission.getAttemptCount());
        }
        return Detail.from(submission);
    }

    private IrdBillPayload buildPayload(Invoice invoice) {
        LaboratoryProfile lab = laboratoryProfileService.require();
        return new IrdBillPayload(
                invoice.getInvoiceNumber(),
                invoice.getFiscalYear(),
                invoice.getIssuedAt(),
                lab.getName(),
                lab.getPanNumber(),
                invoice.getPatient().getFullName(),
                null,
                invoice.getSubtotal(),
                invoice.getDiscountAmount(),
                invoice.getTaxableAmount(),
                invoice.getTaxAmount(),
                invoice.getTotalAmount(),
                invoice.getItems().stream()
                        .map(this::toLine)
                        .toList());
    }

    private IrdBillPayload.Line toLine(InvoiceItem item) {
        return new IrdBillPayload.Line(item.getTestName(), item.getQuantity(), item.getUnitPrice(), item.getLineTotal());
    }

    private IrdSubmission load(Long id) {
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
