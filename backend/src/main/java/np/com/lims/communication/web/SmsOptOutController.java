package np.com.lims.communication.web;

import jakarta.validation.Valid;
import np.com.lims.common.api.PageResponse;
import np.com.lims.communication.SmsOptOutService;
import np.com.lims.communication.dto.CommunicationDtos.OptOutRequest;
import np.com.lims.communication.dto.CommunicationDtos.OptOutResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/** The SMS do-not-contact list — see {@code SmsOptOut}'s own javadoc for the enforcement model. */
@RestController
@RequestMapping("/communication/opt-outs")
@PreAuthorize("hasAuthority('PERM_COMMUNICATION_SEND')")
public class SmsOptOutController {

    private final SmsOptOutService service;

    public SmsOptOutController(SmsOptOutService service) {
        this.service = service;
    }

    @GetMapping
    public PageResponse<OptOutResponse> list(Pageable pageable) {
        return service.list(pageable);
    }

    @PostMapping
    public OptOutResponse optOut(@Valid @RequestBody OptOutRequest request) {
        return service.optOut(request);
    }

    @DeleteMapping("/{id}")
    public void remove(@PathVariable Long id) {
        service.remove(id);
    }
}
