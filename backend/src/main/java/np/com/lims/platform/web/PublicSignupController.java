package np.com.lims.platform.web;

import jakarta.validation.Valid;
import np.com.lims.platform.PlatformService;
import np.com.lims.platform.dto.PlatformDtos.CreateOrganizationRequest;
import np.com.lims.platform.dto.PlatformDtos.OrganizationDetail;
import np.com.lims.platform.dto.PlatformDtos.PlanDto;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Public, unauthenticated signup — a clinic can create its own trial account without a platform
 * admin's involvement. Deliberately a separate controller/path from {@code PlatformController}
 * (which stays entirely behind {@code PERM_PLATFORM_MANAGE}) rather than exempting one method,
 * so the permit-all surface is a single, obviously-named path — see {@code SecurityConfig}'s
 * {@code PUBLIC_ENDPOINTS}.
 */
@RestController
@RequestMapping("/public")
public class PublicSignupController {

    private final PlatformService service;

    public PublicSignupController(PlatformService service) {
        this.service = service;
    }

    @GetMapping("/plans")
    public List<PlanDto> plans() {
        return service.publicPlans();
    }

    @PostMapping("/signup")
    @ResponseStatus(HttpStatus.CREATED)
    public OrganizationDetail signup(@Valid @RequestBody CreateOrganizationRequest request) {
        OrganizationDetail detail = service.selfSignup(request);
        service.recordSelfSignupAudit(detail.id());
        return detail;
    }
}
