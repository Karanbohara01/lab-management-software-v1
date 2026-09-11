package np.com.lims.order.web;

import jakarta.validation.Valid;
import np.com.lims.common.api.PageResponse;
import np.com.lims.order.LabOrderService;
import np.com.lims.order.dto.OrderDtos.CancelRequest;
import np.com.lims.order.dto.OrderDtos.Detail;
import np.com.lims.order.dto.OrderDtos.ListItem;
import np.com.lims.order.dto.OrderDtos.Pricing;
import np.com.lims.order.dto.OrderDtos.PreviewRequest;
import np.com.lims.order.dto.OrderDtos.SaveRequest;
import np.com.lims.order.entity.OrderStatus;
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
@RequestMapping("/orders")
public class LabOrderController {

    private final LabOrderService service;

    public LabOrderController(LabOrderService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_LAB_ORDER_READ')")
    public PageResponse<ListItem> list(
            @RequestParam(required = false) Long patientId,
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) String query,
            @PageableDefault(size = 20, sort = "orderedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return PageResponse.from(service.search(patientId, status, branchId, query, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_LAB_ORDER_READ')")
    public Detail get(@PathVariable Long id) {
        return service.get(id);
    }

    @PostMapping("/preview")
    @PreAuthorize("hasAuthority('PERM_LAB_ORDER_READ')")
    public Pricing preview(@Valid @RequestBody PreviewRequest request) {
        return service.preview(request);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('PERM_LAB_ORDER_WRITE')")
    public Detail create(@Valid @RequestBody SaveRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_LAB_ORDER_WRITE')")
    public Detail update(@PathVariable Long id, @Valid @RequestBody SaveRequest request) {
        return service.update(id, request);
    }

    @PostMapping("/{id}/confirm")
    @PreAuthorize("hasAuthority('PERM_LAB_ORDER_WRITE')")
    public Detail confirm(@PathVariable Long id) {
        return service.confirm(id);
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAuthority('PERM_LAB_ORDER_WRITE')")
    public Detail cancel(@PathVariable Long id, @Valid @RequestBody(required = false) CancelRequest request) {
        return service.cancel(id, request == null ? null : request.reason());
    }
}
