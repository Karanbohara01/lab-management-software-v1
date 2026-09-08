package np.com.lims.doctor.web;

import jakarta.validation.Valid;
import np.com.lims.common.api.PageResponse;
import np.com.lims.doctor.DoctorService;
import np.com.lims.doctor.dto.DoctorDtos.Response;
import np.com.lims.doctor.dto.DoctorDtos.UpsertRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/doctors")
public class DoctorController {

    private final DoctorService service;

    public DoctorController(DoctorService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_DOCTOR_READ')")
    public PageResponse<Response> list(
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "true") boolean activeOnly,
            @PageableDefault(sort = "fullName") Pageable pageable) {
        return PageResponse.from(service.search(query, activeOnly, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_DOCTOR_READ')")
    public Response get(@PathVariable Long id) {
        return service.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('PERM_DOCTOR_WRITE')")
    public Response create(@Valid @RequestBody UpsertRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_DOCTOR_WRITE')")
    public Response update(@PathVariable Long id, @Valid @RequestBody UpsertRequest request) {
        return service.update(id, request);
    }

    @PatchMapping("/{id}/active")
    @PreAuthorize("hasAuthority('PERM_DOCTOR_WRITE')")
    public Response setActive(@PathVariable Long id, @RequestParam boolean value) {
        service.setActive(id, value);
        return service.get(id);
    }
}
