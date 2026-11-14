package np.com.lims.communication.web;

import jakarta.validation.Valid;
import np.com.lims.communication.SmsTemplateService;
import np.com.lims.communication.dto.CommunicationDtos.TemplateRequest;
import np.com.lims.communication.dto.CommunicationDtos.TemplateResponse;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/communication/templates")
public class SmsTemplateController {

    private final SmsTemplateService service;

    public SmsTemplateController(SmsTemplateService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_COMMUNICATION_READ')")
    public List<TemplateResponse> list() {
        return service.list();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_COMMUNICATION_READ')")
    public TemplateResponse get(@PathVariable Long id) {
        return service.get(id);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PERM_COMMUNICATION_TEMPLATE_MANAGE')")
    public TemplateResponse create(@Valid @RequestBody TemplateRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_COMMUNICATION_TEMPLATE_MANAGE')")
    public TemplateResponse update(@PathVariable Long id, @Valid @RequestBody TemplateRequest request) {
        return service.update(id, request);
    }

    @PutMapping("/{id}/active")
    @PreAuthorize("hasAuthority('PERM_COMMUNICATION_TEMPLATE_MANAGE')")
    public TemplateResponse setActive(@PathVariable Long id, @RequestBody ActiveRequest request) {
        return service.setActive(id, request.active());
    }

    public record ActiveRequest(boolean active) {
    }
}
