package np.com.lims.platform.web;

import np.com.lims.platform.LeadershipService;
import np.com.lims.platform.dto.LeadershipDtos.PublicProfile;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * The leadership profiles for the public landing page — unauthenticated and read-only, and a
 * separate controller from {@link LeadershipController} so the permit-all surface stays one small,
 * obviously-named path (see SecurityConfig's PUBLIC_ENDPOINTS). It returns only profiles that have
 * been given a name, and only the fields the page shows.
 */
@RestController
@RequestMapping("/public/leadership")
public class PublicLeadershipController {

    private final LeadershipService service;

    public PublicLeadershipController(LeadershipService service) {
        this.service = service;
    }

    @GetMapping
    public List<PublicProfile> profiles() {
        return service.publicProfiles();
    }
}
