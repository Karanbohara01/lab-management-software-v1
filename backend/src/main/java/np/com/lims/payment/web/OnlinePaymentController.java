package np.com.lims.payment.web;

import jakarta.validation.Valid;
import np.com.lims.payment.OnlinePaymentService;
import np.com.lims.payment.dto.PaymentGatewayDtos.InitiateRequest;
import np.com.lims.payment.dto.PaymentGatewayDtos.InitiateResponse;
import np.com.lims.payment.dto.PaymentGatewayDtos.OnlinePaymentDto;
import np.com.lims.payment.dto.PaymentGatewayDtos.ProviderStatusDto;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class OnlinePaymentController {

    private final OnlinePaymentService service;

    public OnlinePaymentController(OnlinePaymentService service) {
        this.service = service;
    }

    @GetMapping("/payment-gateways")
    @PreAuthorize("hasAuthority('PERM_PAYMENT_READ')")
    public List<ProviderStatusDto> providers() {
        return service.providerStatuses().stream()
                .map(s -> new ProviderStatusDto(s.provider(), s.configured()))
                .toList();
    }

    @PostMapping("/invoices/{invoiceId}/online-payments/initiate")
    @PreAuthorize("hasAuthority('PERM_PAYMENT_WRITE')")
    public InitiateResponse initiate(@PathVariable Long invoiceId, @Valid @RequestBody InitiateRequest request) {
        return service.initiate(invoiceId, request.provider());
    }

    @PostMapping("/online-payments/{id}/verify")
    @PreAuthorize("hasAuthority('PERM_PAYMENT_WRITE')")
    public OnlinePaymentDto verify(@PathVariable Long id) {
        return service.verify(id);
    }

    @GetMapping("/invoices/{invoiceId}/online-payments")
    @PreAuthorize("hasAuthority('PERM_PAYMENT_READ')")
    public List<OnlinePaymentDto> list(@PathVariable Long invoiceId) {
        return service.listForInvoice(invoiceId);
    }
}
