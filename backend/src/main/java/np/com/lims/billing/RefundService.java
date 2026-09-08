package np.com.lims.billing;

import np.com.lims.billing.dto.BillingDtos.RefundDto;
import np.com.lims.billing.dto.BillingDtos.RefundRequest;
import np.com.lims.billing.entity.Invoice;
import np.com.lims.billing.entity.Payment;
import np.com.lims.billing.entity.Refund;
import np.com.lims.billing.entity.RefundStatus;
import np.com.lims.common.audit.AuditService;
import np.com.lims.common.exception.ApiException;
import np.com.lims.common.web.CurrentUser;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class RefundService {

    private static final String MODULE = "REFUND";

    private final RefundRepository refundRepository;
    private final InvoiceRepository invoiceRepository;
    private final AuditService auditService;

    public RefundService(RefundRepository refundRepository,
                         InvoiceRepository invoiceRepository,
                         AuditService auditService) {
        this.refundRepository = refundRepository;
        this.invoiceRepository = invoiceRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public Page<RefundDto> list(RefundStatus status, Pageable pageable) {
        Page<Refund> page = status == null
                ? refundRepository.findAllByOrderByRequestedAtDesc(pageable)
                : refundRepository.findByStatusOrderByRequestedAtDesc(status, pageable);
        return page.map(RefundDto::from);
    }

    @Transactional(readOnly = true)
    public RefundDto get(Long id) {
        return RefundDto.from(load(id));
    }

    @Transactional
    public RefundDto request(Long invoiceId, RefundRequest request) {
        Invoice invoice = invoiceRepository.findDetailedById(invoiceId)
                .orElseThrow(() -> ApiException.notFound("Invoice", invoiceId));

        Payment payment = null;
        if (request.paymentId() != null) {
            payment = invoice.getPayments().stream()
                    .filter(p -> p.getId().equals(request.paymentId()))
                    .findFirst()
                    .orElseThrow(() -> ApiException.notFound("Payment", request.paymentId()));
        }

        Refund refund = invoice.requestRefund(request.amount(), request.reason().trim(), payment,
                CurrentUser.username());
        Refund saved = refundRepository.save(refund);
        auditService.record(MODULE, "REQUEST", "Refund", saved.getId(),
                "Requested refund of " + request.amount() + " on invoice " + invoice.getInvoiceNumber()
                        + " – " + request.reason(), null, RefundDto.from(saved));
        return RefundDto.from(saved);
    }

    @Transactional
    public RefundDto approve(Long id, String note) {
        Refund refund = load(id);
        refund.approve(CurrentUser.username(), trimToNull(note));
        refund.getInvoice().applyApprovedRefund(refund);
        auditService.record(MODULE, "APPROVE", "Refund", id,
                "Approved refund of " + refund.getAmount() + " on invoice "
                        + refund.getInvoice().getInvoiceNumber(), null, RefundDto.from(refund));
        return RefundDto.from(refund);
    }

    @Transactional
    public RefundDto reject(Long id, String note) {
        Refund refund = load(id);
        refund.reject(CurrentUser.username(), trimToNull(note));
        auditService.record(MODULE, "REJECT", "Refund", id,
                "Rejected refund of " + refund.getAmount() + " on invoice "
                        + refund.getInvoice().getInvoiceNumber(), null, RefundDto.from(refund));
        return RefundDto.from(refund);
    }

    private Refund load(Long id) {
        return refundRepository.findDetailedById(id).orElseThrow(() -> ApiException.notFound("Refund", id));
    }

    private static String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
