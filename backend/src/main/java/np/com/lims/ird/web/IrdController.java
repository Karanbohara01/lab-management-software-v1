package np.com.lims.ird.web;

import jakarta.validation.Valid;
import np.com.lims.common.api.PageResponse;
import np.com.lims.ird.IrdSubmissionService;
import np.com.lims.ird.dto.IrdDtos.CancelRequest;
import np.com.lims.ird.dto.IrdDtos.ConfigResponse;
import np.com.lims.ird.dto.IrdDtos.Detail;
import np.com.lims.ird.dto.IrdDtos.ListItem;
import np.com.lims.ird.dto.IrdDtos.ManualRequest;
import np.com.lims.ird.dto.IrdDtos.SubmitRequest;
import np.com.lims.ird.dto.IrdDtos.Summary;
import np.com.lims.ird.entity.IrdStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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
@RequestMapping("/ird")
public class IrdController {

    private final IrdSubmissionService service;

    public IrdController(IrdSubmissionService service) {
        this.service = service;
    }

    @GetMapping("/config")
    @PreAuthorize("hasAuthority('PERM_IRD_SUBMISSION_READ')")
    public ConfigResponse config() {
        return service.config();
    }

    @GetMapping("/submissions")
    @PreAuthorize("hasAuthority('PERM_IRD_SUBMISSION_READ')")
    public PageResponse<ListItem> list(
            @RequestParam(required = false) IrdStatus status,
            @RequestParam(required = false) String query,
            @PageableDefault(size = 20, sort = "updatedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return PageResponse.from(service.search(status, query, pageable));
    }

    @GetMapping("/submissions/summary")
    @PreAuthorize("hasAuthority('PERM_IRD_SUBMISSION_READ')")
    public Summary summary() {
        return service.summary();
    }

    @GetMapping("/submissions/{id}")
    @PreAuthorize("hasAuthority('PERM_IRD_SUBMISSION_READ')")
    public Detail get(@PathVariable Long id) {
        return service.get(id);
    }

    @GetMapping("/submissions/by-invoice/{invoiceId}")
    @PreAuthorize("hasAuthority('PERM_IRD_SUBMISSION_READ')")
    public Detail getByInvoice(@PathVariable Long invoiceId) {
        return service.getByInvoice(invoiceId);
    }

    @PostMapping("/submissions/submit")
    @PreAuthorize("hasAuthority('PERM_IRD_SUBMISSION_MANAGE')")
    public Detail submit(@Valid @RequestBody SubmitRequest request) {
        return service.submitByInvoice(request.invoiceId());
    }

    @PostMapping("/submissions/{id}/retry")
    @PreAuthorize("hasAuthority('PERM_IRD_SUBMISSION_MANAGE')")
    public Detail retry(@PathVariable Long id) {
        return service.retry(id);
    }

    @PostMapping("/submissions/{id}/manual")
    @PreAuthorize("hasAuthority('PERM_IRD_SUBMISSION_MANAGE')")
    public Detail markManual(@PathVariable Long id, @Valid @RequestBody ManualRequest request) {
        return service.markManual(id, request.reference(), request.note());
    }

    @PostMapping("/submissions/{id}/cancel")
    @PreAuthorize("hasAuthority('PERM_IRD_SUBMISSION_MANAGE')")
    public Detail cancel(@PathVariable Long id, @Valid @RequestBody CancelRequest request) {
        return service.cancel(id, request.reason());
    }
}
