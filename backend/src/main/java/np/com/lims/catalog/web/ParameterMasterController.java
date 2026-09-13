package np.com.lims.catalog.web;

import jakarta.validation.Valid;
import np.com.lims.catalog.ParameterMasterService;
import np.com.lims.catalog.dto.ParameterMasterDtos.Response;
import np.com.lims.catalog.dto.ParameterMasterDtos.UpsertRequest;
import np.com.lims.common.api.PageResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** This clinic's own reusable analyte dictionary — see {@code ParameterMaster}'s javadoc. */
@RestController
@RequestMapping("/parameter-master")
public class ParameterMasterController {

    private final ParameterMasterService service;

    public ParameterMasterController(ParameterMasterService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_TEST_CATALOG_READ')")
    public PageResponse<Response> search(@RequestParam(required = false) String query,
                                         @RequestParam(defaultValue = "true") boolean activeOnly,
                                         @PageableDefault(size = 200) Pageable pageable) {
        return PageResponse.from(service.search(query, activeOnly, pageable));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PERM_TEST_CATALOG_WRITE')")
    public Response create(@Valid @RequestBody UpsertRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_TEST_CATALOG_WRITE')")
    public Response update(@PathVariable Long id, @Valid @RequestBody UpsertRequest request) {
        return service.update(id, request);
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasAuthority('PERM_TEST_CATALOG_WRITE')")
    public void activate(@PathVariable Long id) {
        service.setActive(id, true);
    }

    @PostMapping("/{id}/deactivate")
    @PreAuthorize("hasAuthority('PERM_TEST_CATALOG_WRITE')")
    public void deactivate(@PathVariable Long id) {
        service.setActive(id, false);
    }
}
