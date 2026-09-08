package np.com.lims.inventory.web;

import jakarta.validation.Valid;
import np.com.lims.common.api.PageResponse;
import np.com.lims.inventory.PurchaseOrderService;
import np.com.lims.inventory.dto.InventoryDtos.PoCancelRequest;
import np.com.lims.inventory.dto.InventoryDtos.PoDetail;
import np.com.lims.inventory.dto.InventoryDtos.PoListItem;
import np.com.lims.inventory.dto.InventoryDtos.PoReceiveRequest;
import np.com.lims.inventory.dto.InventoryDtos.PoUpsertRequest;
import np.com.lims.inventory.entity.PurchaseOrderStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/purchase-orders")
public class PurchaseOrderController {

    private final PurchaseOrderService service;

    public PurchaseOrderController(PurchaseOrderService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_INVENTORY_READ')")
    public PageResponse<PoListItem> list(
            @RequestParam(required = false) PurchaseOrderStatus status,
            @RequestParam(required = false) String query,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return PageResponse.from(service.search(status, query, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_INVENTORY_READ')")
    public PoDetail get(@PathVariable Long id) {
        return service.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('PERM_INVENTORY_WRITE')")
    public PoDetail create(@Valid @RequestBody PoUpsertRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_INVENTORY_WRITE')")
    public PoDetail update(@PathVariable Long id, @Valid @RequestBody PoUpsertRequest request) {
        return service.update(id, request);
    }

    @PostMapping("/{id}/submit")
    @PreAuthorize("hasAuthority('PERM_INVENTORY_WRITE')")
    public PoDetail submit(@PathVariable Long id) {
        return service.submit(id);
    }

    @PostMapping("/{id}/receive")
    @PreAuthorize("hasAuthority('PERM_INVENTORY_WRITE')")
    public PoDetail receive(@PathVariable Long id, @Valid @RequestBody PoReceiveRequest request) {
        return service.receive(id, request);
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAuthority('PERM_INVENTORY_WRITE')")
    public PoDetail cancel(@PathVariable Long id, @Valid @RequestBody PoCancelRequest request) {
        return service.cancel(id, request.reason());
    }
}
