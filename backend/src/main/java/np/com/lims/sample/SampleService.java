package np.com.lims.sample;

import np.com.lims.billing.InvoiceRepository;
import np.com.lims.billing.entity.Invoice;
import np.com.lims.billing.entity.PaymentStatus;
import np.com.lims.catalog.entity.SpecimenType;
import np.com.lims.common.audit.AuditService;
import np.com.lims.common.exception.ApiException;
import np.com.lims.common.exception.ErrorCode;
import np.com.lims.common.sequence.SequenceService;
import np.com.lims.common.web.CurrentUser;
import np.com.lims.order.entity.LabOrder;
import np.com.lims.order.entity.LabOrderItem;
import np.com.lims.order.entity.OrderItemStatus;
import np.com.lims.result.TestResultService;
import np.com.lims.sample.dto.SampleDtos.CollectRequest;
import np.com.lims.sample.dto.SampleDtos.Detail;
import np.com.lims.sample.dto.SampleDtos.ListItem;
import np.com.lims.sample.dto.SampleDtos.StatusSummary;
import np.com.lims.sample.entity.Sample;
import np.com.lims.sample.entity.SampleStatus;
import np.com.lims.settings.LaboratoryProfileService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

@Service
public class SampleService {

    private static final String MODULE = "SAMPLE";
    private static final String ACCESSION_SEQUENCE = "ACCESSION_NUMBER";

    private final SampleRepository sampleRepository;
    private final SequenceService sequenceService;
    private final AuditService auditService;
    private final TestResultService testResultService;
    private final LaboratoryProfileService laboratoryProfileService;
    private final InvoiceRepository invoiceRepository;

    public SampleService(SampleRepository sampleRepository,
                         SequenceService sequenceService,
                         AuditService auditService,
                         TestResultService testResultService,
                         LaboratoryProfileService laboratoryProfileService,
                         InvoiceRepository invoiceRepository) {
        this.sampleRepository = sampleRepository;
        this.sequenceService = sequenceService;
        this.auditService = auditService;
        this.testResultService = testResultService;
        this.laboratoryProfileService = laboratoryProfileService;
        this.invoiceRepository = invoiceRepository;
    }

    /**
     * Generates one sample per distinct specimen type in a just-confirmed order.
     * Runs inside the confirming transaction; idempotent per order.
     */
    @Transactional
    public void generateForOrder(LabOrder order) {
        if (sampleRepository.existsByOrderId(order.getId())) {
            return;
        }
        String actor = CurrentUser.username();
        Map<SpecimenType, Sample> bySpecimen = new LinkedHashMap<>();

        for (LabOrderItem item : order.getItems()) {
            if (item.getStatus() == OrderItemStatus.CANCELLED) {
                continue;
            }
            // A profile order item expands to its member tests; each may need its own specimen.
            for (np.com.lims.catalog.entity.LabTest performed : item.getTest().effectiveTests()) {
                SpecimenType specimen = performed.getSpecimenType();
                Sample sample = bySpecimen.computeIfAbsent(specimen, s -> {
                    String accession = sequenceService.nextFormatted(ACCESSION_SEQUENCE, "S", 6);
                    return Sample.create(accession, order, s, actor);
                });
                sample.addItem(item, performed);
            }
        }

        List<Sample> samples = sampleRepository.saveAll(bySpecimen.values());
        auditService.record(MODULE, "GENERATE", "LabOrder", order.getId(),
                "Generated " + samples.size() + " sample(s) for order " + order.getOrderNumber(), null,
                samples.stream().map(Sample::getAccessionNumber).toList());
    }

    @Transactional(readOnly = true)
    public Page<ListItem> search(SampleStatus status, Long orderId, Long patientId, Long departmentId,
                                 Long branchId, String query, Pageable pageable) {
        String normalized = StringUtils.hasText(query) ? query.trim() : null;
        Long effectiveBranchId = np.com.lims.common.web.CurrentUser.branchId() != null
                ? np.com.lims.common.web.CurrentUser.branchId() : branchId;
        return sampleRepository.search(status, orderId, patientId, departmentId, effectiveBranchId, normalized, pageable)
                .map(ListItem::from);
    }

    @Transactional(readOnly = true)
    public List<ListItem> forOrder(Long orderId) {
        return sampleRepository.findByOrderIdOrderByIdAsc(orderId).stream().map(ListItem::from).toList();
    }

    @Transactional(readOnly = true)
    public Detail get(Long id) {
        return Detail.from(load(id));
    }

    @Transactional(readOnly = true)
    public Detail lookup(String code) {
        Sample sample = sampleRepository.findByBarcodeValueIgnoreCase(code.trim())
                .orElseThrow(() -> ApiException.notFound("Sample", code));
        return Detail.from(sample);
    }

    @Transactional(readOnly = true)
    public StatusSummary statusSummary() {
        Map<String, Long> counts = new TreeMap<>();
        for (SampleStatus status : SampleStatus.values()) {
            counts.put(status.name(), 0L);
        }
        sampleRepository.countByStatus().forEach(row -> counts.put(row.getStatus().name(), row.getCount()));
        return new StatusSummary(counts);
    }

    @Transactional
    public Detail collect(Long id, CollectRequest request) {
        Sample sample = load(id);
        boolean overridden = checkPaymentGate(sample, request.paymentOverrideReason());
        sample.collect(CurrentUser.username(),
                trimToNull(request.collectionSite()), trimToNull(request.container()), trimToNull(request.note()));
        if (overridden) {
            audit(sample, "COLLECT_PAYMENT_OVERRIDE", "Collected sample " + sample.getAccessionNumber()
                    + " despite unpaid balance - " + trimToNull(request.paymentOverrideReason()));
        } else {
            audit(sample, "COLLECT", "Collected sample " + sample.getAccessionNumber());
        }
        return Detail.from(sample);
    }

    /**
     * Enforces the optional "pay before collection" gate (Settings → require-payment-before-collection).
     * Third-party-billed patients (insurance/SSF/corporate/...) are always exempt — they're billed on
     * account, not at the counter. Self-pay patients need their order's invoice paid in full, unless a
     * documented override reason is supplied (audited). Returns true when an override was used.
     */
    private boolean checkPaymentGate(Sample sample, String overrideReason) {
        if (!laboratoryProfileService.require().isRequirePaymentBeforeCollection()) {
            return false;
        }
        if (sample.getPatient().getPayer().isThirdParty()) {
            return false;
        }
        Invoice invoice = invoiceRepository.findByOrderId(sample.getOrder().getId()).orElse(null);
        boolean settled = invoice != null
                && (invoice.paymentStatus() == PaymentStatus.PAID || invoice.paymentStatus() == PaymentStatus.OVERPAID);
        if (settled) {
            return false;
        }
        String reason = trimToNull(overrideReason);
        if (reason == null) {
            throw new ApiException(ErrorCode.RESOURCE_CONFLICT,
                    "Payment has not been received for this order yet. Take payment first, or collect anyway "
                            + "with a documented reason.");
        }
        return true;
    }

    @Transactional
    public Detail receive(Long id, String note, np.com.lims.sample.dto.SampleDtos.ConditionDto condition) {
        Sample sample = load(id);
        var cond = condition == null ? null : condition.toEntity();
        sample.receive(CurrentUser.username(), trimToNull(note), cond);
        testResultService.generateForSample(sample);
        String summary = "Received sample " + sample.getAccessionNumber()
                + (cond != null && !cond.isAcceptable() ? " - condition: " + cond.summary() : "");
        audit(sample, "RECEIVE", summary);
        return Detail.from(sample);
    }

    @Transactional
    public Detail reject(Long id, String reason) {
        Sample sample = load(id);
        sample.reject(CurrentUser.username(), reason == null ? null : reason.trim());
        audit(sample, "REJECT", "Rejected sample " + sample.getAccessionNumber() + " – " + reason);
        return Detail.from(sample);
    }

    @Transactional
    public Detail recollect(Long id, String note) {
        Sample sample = load(id);
        sample.reopenForRecollection(CurrentUser.username(), trimToNull(note));
        audit(sample, "RECOLLECT", "Requested recollection of sample " + sample.getAccessionNumber());
        return Detail.from(sample);
    }

    @Transactional
    public Detail addNote(Long id, String note) {
        Sample sample = load(id);
        sample.addNote(CurrentUser.username(), note.trim());
        return Detail.from(sample);
    }

    private void audit(Sample sample, String action, String summary) {
        auditService.record(MODULE, action, "Sample", sample.getId(), summary, null, Detail.from(sample));
    }

    private Sample load(Long id) {
        return sampleRepository.findDetailedById(id).orElseThrow(() -> ApiException.notFound("Sample", id));
    }

    private static String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
