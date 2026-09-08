package np.com.lims.department.web;

import jakarta.validation.Valid;
import np.com.lims.department.DepartmentService;
import np.com.lims.department.dto.DepartmentDtos.CreateRequest;
import np.com.lims.department.dto.DepartmentDtos.Response;
import np.com.lims.department.dto.DepartmentDtos.UpdateRequest;
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

import java.util.List;

@RestController
@RequestMapping("/departments")
public class DepartmentController {

    private final DepartmentService service;

    public DepartmentController(DepartmentService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_DEPARTMENT_READ')")
    public List<Response> list(@RequestParam(defaultValue = "false") boolean activeOnly) {
        return service.list(activeOnly);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_DEPARTMENT_READ')")
    public Response get(@PathVariable Long id) {
        return service.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('PERM_DEPARTMENT_WRITE')")
    public Response create(@Valid @RequestBody CreateRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_DEPARTMENT_WRITE')")
    public Response update(@PathVariable Long id, @Valid @RequestBody UpdateRequest request) {
        return service.update(id, request);
    }

    @PatchMapping("/{id}/active")
    @PreAuthorize("hasAuthority('PERM_DEPARTMENT_WRITE')")
    public Response setActive(@PathVariable Long id, @RequestParam boolean value) {
        service.setActive(id, value);
        return service.get(id);
    }
}
