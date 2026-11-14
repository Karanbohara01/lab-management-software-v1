package np.com.lims.settings.web;

import jakarta.validation.Valid;
import np.com.lims.settings.ReportSignatoryService;
import np.com.lims.settings.dto.ReportSignatoryDtos.Response;
import np.com.lims.settings.dto.ReportSignatoryDtos.UpsertRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/settings/report-signatories")
public class ReportSignatoryController {

    private final ReportSignatoryService service;

    public ReportSignatoryController(ReportSignatoryService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_SETTINGS_READ')")
    public List<Response> list() {
        return service.list();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('PERM_SETTINGS_WRITE')")
    public Response create(@Valid @RequestBody UpsertRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_SETTINGS_WRITE')")
    public Response update(@PathVariable Long id, @Valid @RequestBody UpsertRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('PERM_SETTINGS_WRITE')")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
