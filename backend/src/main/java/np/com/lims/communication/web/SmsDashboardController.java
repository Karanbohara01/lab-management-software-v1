package np.com.lims.communication.web;

import np.com.lims.communication.SmsDashboardService;
import np.com.lims.communication.dto.CommunicationDtos.DashboardResponse;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/communication/dashboard")
public class SmsDashboardController {

    private final SmsDashboardService service;

    public SmsDashboardController(SmsDashboardService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_COMMUNICATION_READ')")
    public DashboardResponse summary() {
        return service.summary();
    }
}
