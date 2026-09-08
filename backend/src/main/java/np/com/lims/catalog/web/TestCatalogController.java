package np.com.lims.catalog.web;

import jakarta.validation.Valid;
import np.com.lims.catalog.LabTestService;
import np.com.lims.catalog.dto.TestDtos.CreateRequest;
import np.com.lims.catalog.dto.TestDtos.Detail;
import np.com.lims.catalog.dto.TestDtos.ListItem;
import np.com.lims.catalog.dto.TestDtos.UpdateRequest;
import np.com.lims.common.api.PageResponse;
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
@RequestMapping("/tests")
public class TestCatalogController {

    private final LabTestService service;

    public TestCatalogController(LabTestService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_TEST_CATALOG_READ')")
    public PageResponse<ListItem> list(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(defaultValue = "true") boolean activeOnly,
            @PageableDefault(size = 20, sort = "name") Pageable pageable) {
        return PageResponse.from(service.search(query, departmentId, activeOnly, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_TEST_CATALOG_READ')")
    public Detail get(@PathVariable Long id) {
        return service.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('PERM_TEST_CATALOG_WRITE')")
    public Detail create(@Valid @RequestBody CreateRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_TEST_CATALOG_WRITE')")
    public Detail update(@PathVariable Long id, @Valid @RequestBody UpdateRequest request) {
        return service.update(id, request);
    }

    @PatchMapping("/{id}/active")
    @PreAuthorize("hasAuthority('PERM_TEST_CATALOG_WRITE')")
    public Detail setActive(@PathVariable Long id, @RequestParam boolean value) {
        service.setActive(id, value);
        return service.get(id);
    }
}
