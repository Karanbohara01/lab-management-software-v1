package np.com.lims.inventory.web;

import jakarta.validation.Valid;
import np.com.lims.common.api.PageResponse;
import np.com.lims.inventory.SupplierService;
import np.com.lims.inventory.dto.InventoryDtos.SupplierRequest;
import np.com.lims.inventory.dto.InventoryDtos.SupplierResponse;
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

import java.util.List;

@RestController
@RequestMapping("/suppliers")
public class SupplierController {

    private final SupplierService service;

    public SupplierController(SupplierService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_INVENTORY_READ')")
    public PageResponse<SupplierResponse> list(
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "false") boolean activeOnly,
            @PageableDefault(size = 20, sort = "name") Pageable pageable) {
        return PageResponse.from(service.search(query, activeOnly, pageable));
    }

    @GetMapping("/active")
    @PreAuthorize("hasAuthority('PERM_INVENTORY_READ')")
    public List<SupplierResponse> active() {
        return service.activeList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('PERM_INVENTORY_WRITE')")
    public SupplierResponse create(@Valid @RequestBody SupplierRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_INVENTORY_WRITE')")
    public SupplierResponse update(@PathVariable Long id, @Valid @RequestBody SupplierRequest request) {
        return service.update(id, request);
    }

    @PatchMapping("/{id}/active")
    @PreAuthorize("hasAuthority('PERM_INVENTORY_WRITE')")
    public void setActive(@PathVariable Long id, @RequestParam boolean value) {
        service.setActive(id, value);
    }
}
