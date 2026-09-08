package np.com.lims.settings.web;

import jakarta.validation.Valid;
import np.com.lims.settings.LaboratoryProfileService;
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

    @PutMapping
    @PreAuthorize("hasAuthority('PERM_SETTINGS_WRITE')")
    public Response update(@Valid @RequestBody UpdateRequest request) {
        return service.update(request);
    }
}
