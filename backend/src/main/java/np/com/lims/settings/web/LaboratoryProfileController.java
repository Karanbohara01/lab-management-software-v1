package np.com.lims.settings.web;

import jakarta.validation.Valid;
import np.com.lims.settings.LaboratoryProfileService;
import np.com.lims.settings.dto.LaboratoryProfileDtos.Branding;
import np.com.lims.settings.dto.LaboratoryProfileDtos.Response;
import np.com.lims.settings.dto.LaboratoryProfileDtos.UpdateRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/settings/laboratory")
public class LaboratoryProfileController {

    private final LaboratoryProfileService service;

    public LaboratoryProfileController(LaboratoryProfileService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_SETTINGS_READ')")
    public Response get() {
        return service.get();
    }

    /** Name and logo only, for the app header — open to every signed-in user, unlike the full profile. */
    @GetMapping("/branding")
    @PreAuthorize("isAuthenticated()")
    public Branding branding() {
        return service.branding();
    }

    @PutMapping
    @PreAuthorize("hasAuthority('PERM_SETTINGS_WRITE')")
    public Response update(@Valid @RequestBody UpdateRequest request) {
        return service.update(request);
    }
}
