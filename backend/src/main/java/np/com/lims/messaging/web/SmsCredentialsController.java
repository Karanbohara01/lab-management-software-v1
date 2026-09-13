package np.com.lims.messaging.web;

import jakarta.validation.Valid;
import np.com.lims.messaging.SmsCredentialsService;
import np.com.lims.messaging.dto.SmsCredentialsDtos.Response;
import np.com.lims.messaging.dto.SmsCredentialsDtos.UpdateRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** This organization's own Sparrow SMS credentials — same permission as the rest of Settings. */
@RestController
@RequestMapping("/settings/sms-credentials")
public class SmsCredentialsController {

    private final SmsCredentialsService service;

    public SmsCredentialsController(SmsCredentialsService service) {
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
