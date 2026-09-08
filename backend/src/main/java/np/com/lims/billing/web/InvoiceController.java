package np.com.lims.billing.web;

import jakarta.validation.Valid;
import np.com.lims.billing.InvoiceService;
import np.com.lims.billing.RefundService;
import np.com.lims.billing.dto.BillingDtos.AdjustInvoiceRequest;
import np.com.lims.billing.dto.BillingDtos.CancelRequest;
import np.com.lims.billing.dto.BillingDtos.CreateInvoiceRequest;
import np.com.lims.billing.dto.BillingDtos.Detail;
import np.com.lims.billing.dto.BillingDtos.ListItem;
import np.com.lims.billing.dto.BillingDtos.PaymentRequest;
import np.com.lims.billing.dto.BillingDtos.RefundDto;
import np.com.lims.billing.dto.BillingDtos.RefundRequest;
import np.com.lims.billing.entity.InvoiceStatus;
import np.com.lims.common.api.PageResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/invoices")
public class InvoiceController {

    private final InvoiceService invoiceService;
    private final RefundService refundService;

    public InvoiceController(InvoiceService invoiceService, RefundService refundService) {
        this.invoiceService = invoiceService;
        this.refundService = refundService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_INVOICE_READ')")
    public PageResponse<ListItem> list(
            @RequestParam(required = false) InvoiceStatus status,
            @RequestParam(required = false) Long patientId,
            @RequestParam(defaultValue = "false") boolean unpaidOnly,
            @RequestParam(required = false) String query,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return PageResponse.from(invoiceService.search(status, patientId, unpaidOnly, query, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_INVOICE_READ')")
    public Detail get(@PathVariable Long id) {
        return invoiceService.get(id);
    }

    @GetMapping("/by-order/{orderId}")
    @PreAuthorize("hasAuthority('PERM_INVOICE_READ')")
    public Detail getByOrder(@PathVariable Long orderId) {
        return invoiceService.getByOrder(orderId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('PERM_INVOICE_WRITE')")
    public Detail create(@Valid @RequestBody CreateInvoiceRequest request) {
        return invoiceService.createFromOrder(request.orderId());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_INVOICE_WRITE')")
    public Detail adjust(@PathVariable Long id, @Valid @RequestBody AdjustInvoiceRequest request) {
        return invoiceService.adjust(id, request);
    }

    @PostMapping("/{id}/issue")
    @PreAuthorize("hasAuthority('PERM_INVOICE_WRITE')")
    public Detail issue(@PathVariable Long id) {
        return invoiceService.issue(id);
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAuthority('PERM_INVOICE_CANCEL')")
    public Detail cancel(@PathVariable Long id, @Valid @RequestBody CancelRequest request) {
        return invoiceService.cancel(id, request.reason());
    }

    @PostMapping("/{id}/payments")
    @PreAuthorize("hasAuthority('PERM_PAYMENT_WRITE')")
    public Detail recordPayment(@PathVariable Long id, @Valid @RequestBody PaymentRequest request) {
        return invoiceService.recordPayment(id, request);
    }

    @PostMapping("/{id}/refunds")
    @PreAuthorize("hasAuthority('PERM_REFUND_REQUEST')")
    public RefundDto requestRefund(@PathVariable Long id, @Valid @RequestBody RefundRequest request) {
        return refundService.request(id, request);
    }
}
