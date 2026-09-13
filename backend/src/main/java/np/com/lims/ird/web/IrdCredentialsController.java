package np.com.lims.ird.web;

import jakarta.validation.Valid;
import np.com.lims.ird.IrdCredentialsService;
import np.com.lims.ird.dto.IrdCredentialsDtos.Response;
import np.com.lims.ird.dto.IrdCredentialsDtos.UpdateRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** This organization's own IRD/CBMS credentials — same permission as the rest of Settings. */
@RestController
@RequestMapping("/settings/ird-credentials")
public class IrdCredentialsController {

    private final IrdCredentialsService service;

    public IrdCredentialsController(IrdCredentialsService service) {
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
