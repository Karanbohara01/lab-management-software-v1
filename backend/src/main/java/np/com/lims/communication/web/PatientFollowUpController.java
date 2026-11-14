package np.com.lims.communication.web;

import jakarta.validation.Valid;
import np.com.lims.communication.PatientFollowUpService;
import np.com.lims.communication.dto.CommunicationDtos.FollowUpRequest;
import np.com.lims.communication.dto.CommunicationDtos.FollowUpResponse;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/communication/follow-ups")
public class PatientFollowUpController {

    private final PatientFollowUpService service;

    public PatientFollowUpController(PatientFollowUpService service) {
        this.service = service;
    }

    @GetMapping("/by-patient/{patientId}")
    @PreAuthorize("hasAuthority('PERM_COMMUNICATION_READ')")
    public List<FollowUpResponse> listForPatient(@PathVariable Long patientId) {
        return service.listForPatient(patientId);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PERM_COMMUNICATION_SEND')")
    public FollowUpResponse create(@Valid @RequestBody FollowUpRequest request) {
        return service.create(request);
    }

    @PostMapping("/{id}/done")
    @PreAuthorize("hasAuthority('PERM_COMMUNICATION_SEND')")
    public void markDone(@PathVariable Long id) {
        service.markDone(id);
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAuthority('PERM_COMMUNICATION_SEND')")
    public void cancel(@PathVariable Long id) {
        service.cancel(id);
    }
}
