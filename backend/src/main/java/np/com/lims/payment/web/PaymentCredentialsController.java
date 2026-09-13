package np.com.lims.payment.web;

import jakarta.validation.Valid;
import np.com.lims.payment.PaymentCredentialsService;
import np.com.lims.payment.dto.PaymentCredentialsDtos.Response;
import np.com.lims.payment.dto.PaymentCredentialsDtos.UpdateRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** This organization's own eSewa/Khalti credentials — same permission as the rest of Settings. */
@RestController
@RequestMapping("/settings/payment-credentials")
public class PaymentCredentialsController {

    private final PaymentCredentialsService service;

    public PaymentCredentialsController(PaymentCredentialsService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_SETTINGS_READ')")
    public Response get() {
        return service.get();
    }

    @PutMapping
    @PreAuthorize("hasAuthority('PERM_SETTINGS_WRITE')")
    public Response update(@Valid @RequestBody UpdateRequest request) {
        return service.update(request);
    }
}
