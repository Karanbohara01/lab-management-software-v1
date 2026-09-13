package np.com.lims.platform.web;

import jakarta.validation.Valid;
import np.com.lims.common.api.PageResponse;
import np.com.lims.platform.SubscriptionBillingService;
import np.com.lims.platform.dto.SubscriptionBillingDtos.ChangePlanRequest;
import np.com.lims.platform.dto.SubscriptionBillingDtos.InitiateCheckoutResponse;
import np.com.lims.platform.dto.SubscriptionBillingDtos.MySubscriptionResponse;
import np.com.lims.platform.dto.SubscriptionBillingDtos.SubscriptionInvoiceDto;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * This clinic's own subscription-billing history — what it owes the PLATFORM, never to be
 * confused with {@code /invoices}/{@code /online-payments} (what this clinic charges its own
 * patients). Gated the same way as the payment/IRD/SMS/WhatsApp credential cards: reading is
 * {@code PERM_SETTINGS_READ}, paying is {@code PERM_SETTINGS_WRITE} — a clinic's billing is a
 * settings-adjacent concern, not a clinical one.
 */
@RestController
@RequestMapping("/billing/subscription")
public class SubscriptionBillingController {

    private final SubscriptionBillingService service;

    public SubscriptionBillingController(SubscriptionBillingService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_SETTINGS_READ')")
    public MySubscriptionResponse mySubscription() {
        return service.mySubscription();
    }

    @PostMapping("/change-plan")
    @PreAuthorize("hasAuthority('PERM_SETTINGS_WRITE')")
    public MySubscriptionResponse changePlan(@Valid @RequestBody ChangePlanRequest request) {
        return service.requestPlanChange(request.planCode());
    }

    @GetMapping("/invoices")
    @PreAuthorize("hasAuthority('PERM_SETTINGS_READ')")
    public PageResponse<SubscriptionInvoiceDto> invoices(@PageableDefault(size = 20) Pageable pageable) {
        return PageResponse.from(service.myInvoices(pageable));
    }

    @GetMapping("/invoices/{id}")
    @PreAuthorize("hasAuthority('PERM_SETTINGS_READ')")
    public SubscriptionInvoiceDto get(@PathVariable Long id) {
        return service.get(id);
    }

    @PostMapping("/invoices/{id}/pay")
    @PreAuthorize("hasAuthority('PERM_SETTINGS_WRITE')")
    public InitiateCheckoutResponse pay(@PathVariable Long id) {
        return service.initiateCheckout(id);
    }

    @PostMapping("/invoices/{id}/verify")
    @PreAuthorize("hasAuthority('PERM_SETTINGS_WRITE')")
    public SubscriptionInvoiceDto verify(@PathVariable Long id) {
        return service.verifyCheckout(id);
    }
}
