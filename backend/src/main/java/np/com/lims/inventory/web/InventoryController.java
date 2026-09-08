package np.com.lims.inventory.web;

import jakarta.validation.Valid;
import np.com.lims.common.api.PageResponse;
import np.com.lims.inventory.InventoryItemService;
import np.com.lims.inventory.dto.InventoryDtos.AdjustBatchRequest;
import np.com.lims.inventory.dto.InventoryDtos.DiscardBatchRequest;
import np.com.lims.inventory.dto.InventoryDtos.InventorySummary;
import np.com.lims.inventory.dto.InventoryDtos.ItemCreateRequest;
import np.com.lims.inventory.dto.InventoryDtos.ItemDetail;
import np.com.lims.inventory.dto.InventoryDtos.ItemListItem;
import np.com.lims.inventory.dto.InventoryDtos.ItemUpdateRequest;
import np.com.lims.inventory.dto.InventoryDtos.IssueStockRequest;
import np.com.lims.inventory.dto.InventoryDtos.ReceiveStockRequest;
import np.com.lims.inventory.dto.InventoryDtos.TransactionDto;
import np.com.lims.inventory.entity.ItemCategory;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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
@RequestMapping("/inventory")
public class InventoryController {

    private final InventoryItemService service;

    public InventoryController(InventoryItemService service) {
        this.service = service;
    }

    @GetMapping("/items")
    @PreAuthorize("hasAuthority('PERM_INVENTORY_READ')")
    public PageResponse<ItemListItem> list(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) ItemCategory category,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(defaultValue = "true") boolean activeOnly,
            @PageableDefault(size = 20, sort = "name") Pageable pageable) {
        return PageResponse.from(service.search(query, category, departmentId, activeOnly, pageable));
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAuthority('PERM_INVENTORY_READ')")
    public InventorySummary summary() {
        return service.summary();
    }

    @GetMapping("/items/{id}")
    @PreAuthorize("hasAuthority('PERM_INVENTORY_READ')")
    public ItemDetail get(@PathVariable Long id) {
        return service.get(id);
    }

    @GetMapping("/items/{id}/transactions")
    @PreAuthorize("hasAuthority('PERM_INVENTORY_READ')")
    public PageResponse<TransactionDto> transactions(
            @PathVariable Long id,
            @PageableDefault(size = 20, sort = "occurredAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return PageResponse.from(service.transactions(id, pageable));
    }

    @PostMapping("/items")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('PERM_INVENTORY_WRITE')")
    public ItemDetail create(@Valid @RequestBody ItemCreateRequest request) {
        return service.create(request);
    }

    @PutMapping("/items/{id}")
    @PreAuthorize("hasAuthority('PERM_INVENTORY_WRITE')")
    public ItemDetail update(@PathVariable Long id, @Valid @RequestBody ItemUpdateRequest request) {
        return service.update(id, request);
    }

    @PatchMapping("/items/{id}/active")
    @PreAuthorize("hasAuthority('PERM_INVENTORY_WRITE')")
    public ItemDetail setActive(@PathVariable Long id, @RequestParam boolean value) {
        service.setActive(id, value);
        return service.get(id);
    }

    @PostMapping("/items/{id}/receive")
    @PreAuthorize("hasAuthority('PERM_INVENTORY_WRITE')")
    public ItemDetail receive(@PathVariable Long id, @Valid @RequestBody ReceiveStockRequest request) {
        return service.receiveStock(id, request);
    }

    @PostMapping("/items/{id}/issue")
    @PreAuthorize("hasAuthority('PERM_INVENTORY_WRITE')")
    public ItemDetail issue(@PathVariable Long id, @Valid @RequestBody IssueStockRequest request) {
        return service.issueStock(id, request);
    }

    @PostMapping("/batches/{id}/adjust")
    @PreAuthorize("hasAuthority('PERM_INVENTORY_WRITE')")
    public ItemDetail adjustBatch(@PathVariable Long id, @Valid @RequestBody AdjustBatchRequest request) {
        return service.adjustBatch(id, request);
    }

    @PostMapping("/batches/{id}/discard")
    @PreAuthorize("hasAuthority('PERM_INVENTORY_WRITE')")
    public ItemDetail discardBatch(@PathVariable Long id, @Valid @RequestBody DiscardBatchRequest request) {
        return service.discardBatch(id, request);
    }
}
