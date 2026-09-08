package np.com.lims.billing.web;

import jakarta.validation.Valid;
import np.com.lims.billing.RefundService;
import np.com.lims.billing.dto.BillingDtos.RefundDecisionRequest;
import np.com.lims.billing.dto.BillingDtos.RefundDto;
import np.com.lims.billing.entity.RefundStatus;
import np.com.lims.common.api.PageResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/refunds")
public class RefundController {

    private final RefundService refundService;

    public RefundController(RefundService refundService) {
        this.refundService = refundService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_PAYMENT_READ')")
    public PageResponse<RefundDto> list(
            @RequestParam(required = false) RefundStatus status,
            @PageableDefault(size = 20) Pageable pageable) {
        return PageResponse.from(refundService.list(status, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_PAYMENT_READ')")
    public RefundDto get(@PathVariable Long id) {
        return refundService.get(id);
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAuthority('PERM_REFUND_APPROVE')")
    public RefundDto approve(@PathVariable Long id, @Valid @RequestBody(required = false) RefundDecisionRequest request) {
        return refundService.approve(id, request == null ? null : request.note());
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAuthority('PERM_REFUND_APPROVE')")
    public RefundDto reject(@PathVariable Long id, @Valid @RequestBody(required = false) RefundDecisionRequest request) {
        return refundService.reject(id, request == null ? null : request.note());
    }
}
