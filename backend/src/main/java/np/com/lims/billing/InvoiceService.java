package np.com.lims.billing;

import np.com.lims.billing.dto.BillingDtos.AdjustInvoiceRequest;
import np.com.lims.billing.dto.BillingDtos.Detail;
import np.com.lims.billing.dto.BillingDtos.ListItem;
import np.com.lims.billing.dto.BillingDtos.PaymentRequest;
import np.com.lims.billing.entity.Invoice;
import np.com.lims.billing.entity.InvoiceItem;
import np.com.lims.billing.entity.InvoiceStatus;
import np.com.lims.common.audit.AuditService;
import np.com.lims.common.exception.ApiException;
import np.com.lims.common.sequence.SequenceService;
import np.com.lims.common.web.CurrentUser;
import np.com.lims.ird.IrdSubmissionService;
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

    private final InvoiceRepository invoiceRepository;
    private final LabOrderRepository orderRepository;
    private final OrderPricingCalculator pricingCalculator;
    private final LaboratoryProfileService laboratoryProfileService;
    private final SequenceService sequenceService;
    private final AuditService auditService;
    private final IrdSubmissionService irdSubmissionService;

    public InvoiceService(InvoiceRepository invoiceRepository,
                          LabOrderRepository orderRepository,
                          OrderPricingCalculator pricingCalculator,
                          LaboratoryProfileService laboratoryProfileService,
                          SequenceService sequenceService,
                          AuditService auditService,
                          IrdSubmissionService irdSubmissionService) {
        this.invoiceRepository = invoiceRepository;
        this.orderRepository = orderRepository;
        this.pricingCalculator = pricingCalculator;
        this.laboratoryProfileService = laboratoryProfileService;
        this.sequenceService = sequenceService;
        this.auditService = auditService;
        this.irdSubmissionService = irdSubmissionService;
    }

    @Transactional(readOnly = true)
    public Page<ListItem> search(InvoiceStatus status, Long patientId, boolean unpaidOnly, String query, Pageable pageable) {
        String normalized = StringUtils.hasText(query) ? query.trim() : null;
        return invoiceRepository.search(status, patientId, unpaidOnly, normalized, pageable).map(ListItem::from);
    }

    @Transactional(readOnly = true)
    public Detail get(Long id) {
        return Detail.from(load(id));
    }

    @Transactional(readOnly = true)
    public Detail getByOrder(Long orderId) {
        return Detail.from(invoiceRepository.findByOrderId(orderId)
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
                "Created draft invoice for order " + order.getOrderNumber(), null, Detail.from(saved));
        return Detail.from(saved);
    }

    @Transactional
    public Detail adjust(Long id, AdjustInvoiceRequest request) {
        Invoice invoice = load(id);
        Detail before = Detail.from(invoice);
        reprice(invoice, request.discountType(), request.discountValue(), request.taxRate());
        invoice.setNotes(trimToNull(request.notes()));
        auditService.record(MODULE, "ADJUST", "Invoice", id,
                "Adjusted draft invoice", before, Detail.from(invoice));
        return Detail.from(invoice);
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
                "Issued invoice " + number, null, Detail.from(invoice));
        return Detail.from(invoice);
    }

    @Transactional
    public Detail cancel(Long id, String reason) {
        Invoice invoice = load(id);
        invoice.cancel(CurrentUser.username(), reason.trim());
        irdSubmissionService.onInvoiceCancelled(invoice);
        auditService.record(MODULE, "CANCEL", "Invoice", id,
                "Cancelled invoice " + invoice.getInvoiceNumber() + " – " + reason, null, Detail.from(invoice));
        return Detail.from(invoice);
    }

    @Transactional
    public Detail recordPayment(Long id, PaymentRequest request) {
        Invoice invoice = load(id);
        invoice.recordPayment(request.amount(), request.method(),
                trimToNull(request.reference()), trimToNull(request.note()), CurrentUser.username());
        auditService.record("PAYMENT", "RECORD", "Invoice", invoice.getId(),
                "Recorded " + request.method() + " payment of " + request.amount()
                        + " against invoice " + invoice.getInvoiceNumber()
                        + " (balance now " + invoice.balance() + ")", null, Detail.from(invoice));
        return Detail.from(invoice);
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

    private static String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
