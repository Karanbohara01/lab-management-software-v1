package np.com.lims.billing;

import np.com.lims.billing.dto.BillingDtos.AdjustInvoiceRequest;
import np.com.lims.billing.dto.BillingDtos.Detail;
import np.com.lims.billing.dto.BillingDtos.ListItem;
import np.com.lims.billing.dto.BillingDtos.MasterBillRow;
import np.com.lims.billing.dto.BillingDtos.PaymentRequest;
import np.com.lims.billing.dto.BillingDtos.SalesBookRow;
import np.com.lims.billing.entity.Invoice;
import np.com.lims.billing.entity.InvoiceItem;
import np.com.lims.billing.entity.InvoiceStatus;
import np.com.lims.common.audit.AuditService;
import np.com.lims.common.exception.ApiException;
import np.com.lims.common.sequence.SequenceService;
import np.com.lims.common.web.CurrentUser;
import np.com.lims.ird.IrdSubmissionRepository;
import np.com.lims.ird.IrdSubmissionService;
import np.com.lims.ird.entity.IrdSubmission;
import np.com.lims.order.LabOrderRepository;
import np.com.lims.order.OrderPricingCalculator;
import np.com.lims.order.entity.DiscountType;
import np.com.lims.order.entity.LabOrder;
import np.com.lims.order.entity.OrderStatus;
import np.com.lims.settings.entity.LaboratoryProfile;
import np.com.lims.settings.LaboratoryProfileService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.List;

@Service
public class InvoiceService {

    private static final String MODULE = "INVOICE";
    private static final int EXPORT_LIMIT = 10_000;

    private final InvoiceRepository invoiceRepository;
    private final LabOrderRepository orderRepository;
    private final OrderPricingCalculator pricingCalculator;
    private final LaboratoryProfileService laboratoryProfileService;
    private final SequenceService sequenceService;
    private final AuditService auditService;
    private final IrdSubmissionService irdSubmissionService;
    private final IrdSubmissionRepository irdSubmissionRepository;

    public InvoiceService(InvoiceRepository invoiceRepository,
                          LabOrderRepository orderRepository,
                          OrderPricingCalculator pricingCalculator,
                          LaboratoryProfileService laboratoryProfileService,
                          SequenceService sequenceService,
                          AuditService auditService,
                          IrdSubmissionService irdSubmissionService,
                          IrdSubmissionRepository irdSubmissionRepository) {
        this.invoiceRepository = invoiceRepository;
        this.orderRepository = orderRepository;
        this.pricingCalculator = pricingCalculator;
        this.laboratoryProfileService = laboratoryProfileService;
        this.sequenceService = sequenceService;
        this.auditService = auditService;
        this.irdSubmissionService = irdSubmissionService;
        this.irdSubmissionRepository = irdSubmissionRepository;
    }

    @Transactional(readOnly = true)
    public Page<ListItem> search(InvoiceStatus status, Long patientId, Long branchId, boolean unpaidOnly,
                                 String query, Pageable pageable) {
        String normalized = StringUtils.hasText(query) ? query.trim() : null;
        Long effectiveBranchId = np.com.lims.common.web.CurrentUser.branchId() != null
                ? np.com.lims.common.web.CurrentUser.branchId() : branchId;
        return invoiceRepository.search(status, patientId, effectiveBranchId, unpaidOnly, normalized, pageable)
                .map(ListItem::from);
    }

    @Transactional(readOnly = true)
    public Detail get(Long id) {
        return detail(load(id));
    }

    @Transactional(readOnly = true)
    public Detail getByOrder(Long orderId) {
        return detail(invoiceRepository.findByOrderId(orderId)
                .orElseThrow(() -> ApiException.notFound("Invoice for order", orderId)));
    }

    @Transactional
    public Detail createFromOrder(Long orderId) {
        if (invoiceRepository.existsByOrderId(orderId)) {
            throw ApiException.conflict("An invoice already exists for this order");
        }
        LabOrder order = orderRepository.findDetailedById(orderId)
                .orElseThrow(() -> ApiException.notFound("Order", orderId));
        if (order.getStatus() != OrderStatus.CONFIRMED) {
            throw ApiException.conflict("Invoices can only be raised for confirmed orders");
        }
        LaboratoryProfile lab = laboratoryProfileService.require();

        Invoice invoice = Invoice.openFor(order, lab.getFiscalYear());
        reprice(invoice, order.getDiscountType(), order.getDiscountValue(), order.getTaxRate());

        Invoice saved = invoiceRepository.save(invoice);
        auditService.record(MODULE, "CREATE", "Invoice", saved.getId(),
                "Created draft invoice for order " + order.getOrderNumber(), null, detail(saved));
        return detail(saved);
    }

    @Transactional
    public Detail adjust(Long id, AdjustInvoiceRequest request) {
        Invoice invoice = load(id);
        Detail before = detail(invoice);
        reprice(invoice, request.discountType(), request.discountValue(), request.taxRate());
        invoice.setNotes(trimToNull(request.notes()));
        auditService.record(MODULE, "ADJUST", "Invoice", id,
                "Adjusted draft invoice", before, detail(invoice));
        return detail(invoice);
    }

    @Transactional
    public Detail issue(Long id) {
        Invoice invoice = load(id);
        if (invoice.getStatus() != InvoiceStatus.DRAFT) {
            throw ApiException.invalidTransition("Only a draft invoice can be issued");
        }
        String number = nextInvoiceNumber(invoice.getFiscalYear());
        invoice.issue(CurrentUser.username(), number);
        irdSubmissionService.onInvoiceIssued(invoice);
        auditService.record(MODULE, "ISSUE", "Invoice", id,
                "Issued invoice " + number, null, detail(invoice));
        return detail(invoice);
    }

    @Transactional
    public Detail cancel(Long id, String reason) {
        Invoice invoice = load(id);
        invoice.cancel(CurrentUser.username(), reason.trim());
        irdSubmissionService.onInvoiceCancelled(invoice);
        auditService.record(MODULE, "CANCEL", "Invoice", id,
                "Cancelled invoice " + invoice.getInvoiceNumber() + " – " + reason, null, detail(invoice));
        return detail(invoice);
    }

    /**
     * Every invoice matching the current filters (up to {@link #EXPORT_LIMIT}), for CSV/XML
     * export — the web layer's {@code spring.data.web.pageable.max-page-size} (100) would
     * otherwise silently truncate a naive "just ask for a huge page size" export to 100 rows.
     * Not truly unbounded: a fully unpaged sort over a large table can exhaust MySQL's sort
     * buffer (hit live on the audit log during testing) — narrow the filters if a report needs
     * more than {@link #EXPORT_LIMIT} rows.
     */
    @Transactional(readOnly = true)
    public List<ListItem> exportAll(InvoiceStatus status, Long branchId, boolean unpaidOnly, String query) {
        String normalized = StringUtils.hasText(query) ? query.trim() : null;
        Long effectiveBranchId = np.com.lims.common.web.CurrentUser.branchId() != null
                ? np.com.lims.common.web.CurrentUser.branchId() : branchId;
        Pageable page = org.springframework.data.domain.PageRequest.of(0, EXPORT_LIMIT,
                org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt"));
        return invoiceRepository.search(status, null, effectiveBranchId, unpaidOnly, normalized, page)
                .map(ListItem::from).getContent();
    }

    /**
     * Master Bill report (Anusuchi-5): every bill issued within a calendar month, including
     * later-cancelled ones (flagged via {@code isBillActive}) — unlike the Sales Book, which is
     * scoped to still-valid sales only.
     */
    @Transactional(readOnly = true)
    public List<MasterBillRow> masterBill(int year, int month, Long branchId) {
        java.time.YearMonth ym = java.time.YearMonth.of(year, month);
        java.time.Instant from = ym.atDay(1).atStartOfDay(java.time.ZoneOffset.UTC).toInstant();
        java.time.Instant to = ym.plusMonths(1).atDay(1).atStartOfDay(java.time.ZoneOffset.UTC).toInstant();
        List<Invoice> invoices = invoiceRepository.findAllIssuedBetween(from, to, branchId);
        java.util.Map<Long, IrdSubmission> submissionsByInvoiceId = irdSubmissionRepository
                .findByInvoiceIdIn(invoices.stream().map(Invoice::getId).toList()).stream()
                .collect(java.util.stream.Collectors.toMap(s -> s.getInvoice().getId(), s -> s));
        return invoices.stream()
                .map(i -> MasterBillRow.from(i, submissionsByInvoiceId.get(i.getId())))
                .toList();
    }

    /** Standalone corrections report (दफा ६(ठ)): every invoice cancelled within a calendar month. */
    @Transactional(readOnly = true)
    public List<np.com.lims.billing.dto.BillingDtos.CorrectionRow> corrections(int year, int month, Long branchId) {
        java.time.YearMonth ym = java.time.YearMonth.of(year, month);
        java.time.Instant from = ym.atDay(1).atStartOfDay(java.time.ZoneOffset.UTC).toInstant();
        java.time.Instant to = ym.plusMonths(1).atDay(1).atStartOfDay(java.time.ZoneOffset.UTC).toInstant();
        List<Invoice> invoices = invoiceRepository.findCancelledBetween(from, to, branchId);
        java.util.Map<Long, IrdSubmission> submissionsByInvoiceId = irdSubmissionRepository
                .findByInvoiceIdIn(invoices.stream().map(Invoice::getId).toList()).stream()
                .collect(java.util.stream.Collectors.toMap(s -> s.getInvoice().getId(), s -> s));
        return invoices.stream()
                .map(i -> np.com.lims.billing.dto.BillingDtos.CorrectionRow.from(i, submissionsByInvoiceId.get(i.getId())))
                .toList();
    }

    /** Sales Book report (Anusuchi-7): every issued invoice within a calendar month. */
    @Transactional(readOnly = true)
    public List<SalesBookRow> salesBook(int year, int month, Long branchId) {
        java.time.YearMonth ym = java.time.YearMonth.of(year, month);
        java.time.Instant from = ym.atDay(1).atStartOfDay(java.time.ZoneOffset.UTC).toInstant();
        java.time.Instant to = ym.plusMonths(1).atDay(1).atStartOfDay(java.time.ZoneOffset.UTC).toInstant();
        return invoiceRepository.findIssuedBetween(from, to, branchId).stream().map(SalesBookRow::from).toList();
    }

    @Transactional
    public Detail markPrinted(Long id) {
        Invoice invoice = load(id);
        // A DRAFT invoice was never issued (no invoice number) and truly can't be printed. A
        // CANCELLED one CAN and per दफा ६(ज) of the e-invoice procedure MUST remain printable —
        // cancelled bills must stay viewable/printable, not disappear from what can be produced.
        if (invoice.getStatus() == InvoiceStatus.DRAFT) {
            throw ApiException.conflict("A draft invoice has no invoice number yet — issue it first");
        }
        int printNo = invoice.recordPrint(CurrentUser.username());
        auditService.record(MODULE, "PRINT", "Invoice", id,
                (printNo == 1 ? "Printed" : "Reprinted (copy #" + printNo + ")") + " invoice "
                        + invoice.getInvoiceNumber(), null, detail(invoice));
        return detail(invoice);
    }

    @Transactional
    public Detail recordPayment(Long id, PaymentRequest request) {
        Invoice invoice = load(id);
        invoice.recordPayment(request.amount(), request.method(),
                trimToNull(request.reference()), trimToNull(request.note()), CurrentUser.username());
        auditService.record("PAYMENT", "RECORD", "Invoice", invoice.getId(),
                "Recorded " + request.method() + " payment of " + request.amount()
                        + " against invoice " + invoice.getInvoiceNumber()
                        + " (balance now " + invoice.balance() + ")", null, detail(invoice));
        return detail(invoice);
    }

    // ----- helpers --------------------------------------------------

    private void reprice(Invoice invoice, DiscountType discountType, BigDecimal discountValue, BigDecimal taxRate) {
        List<BigDecimal> lineTotals = invoice.getItems().stream().map(InvoiceItem::getLineTotal).toList();
        OrderPricingCalculator.Result r = pricingCalculator.compute(lineTotals, discountType, discountValue, taxRate);
        invoice.applyPricing(r.discountType(), r.discountValue(), r.taxRate(), r.subtotal(), r.discountAmount(),
                r.taxableAmount(), r.taxAmount(), r.totalAmount());
    }

    private String nextInvoiceNumber(String fiscalYear) {
        LaboratoryProfile lab = laboratoryProfileService.require();
        long seq = sequenceService.nextOrCreate("INVOICE:" + fiscalYear);
        return "%s-%s-%06d".formatted(lab.getInvoicePrefix(), fiscalYear, seq);
    }

    private Invoice load(Long id) {
        return invoiceRepository.findDetailedById(id).orElseThrow(() -> ApiException.notFound("Invoice", id));
    }

    /**
     * Builds the response DTO with the lab's header fields embedded (name/address/PAN/logo),
     * rather than making the frontend fetch {@code /settings/laboratory} separately — that
     * endpoint requires PERM_SETTINGS_READ, which billing-facing roles like Accountant or
     * Receptionist reasonably don't hold, and would otherwise block them from printing an
     * IRD-compliant invoice at all.
     */
    private Detail detail(Invoice invoice) {
        return Detail.from(invoice, laboratoryProfileService.require());
    }

    private static String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
