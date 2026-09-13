package np.com.lims.messaging.web;

import jakarta.validation.Valid;
import np.com.lims.messaging.WhatsAppCredentialsService;
import np.com.lims.messaging.dto.WhatsAppCredentialsDtos.Response;
import np.com.lims.messaging.dto.WhatsAppCredentialsDtos.UpdateRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** This organization's own WhatsApp Business Cloud API credentials — same permission as the rest of Settings. */
@RestController
@RequestMapping("/settings/whatsapp-credentials")
public class WhatsAppCredentialsController {

    private final WhatsAppCredentialsService service;

    public WhatsAppCredentialsController(WhatsAppCredentialsService service) {
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
