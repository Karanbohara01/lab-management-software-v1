package np.com.lims.report.web;

import jakarta.validation.Valid;
import np.com.lims.common.api.PageResponse;
import np.com.lims.report.ReportService;
import np.com.lims.report.dto.ReportDtos.Detail;
import np.com.lims.report.dto.ReportDtos.DeliverRequest;
import np.com.lims.report.dto.ReportDtos.GenerateRequest;
import np.com.lims.report.dto.ReportDtos.ListItem;
import np.com.lims.report.dto.ReportDtos.SignReleaseRequest;
import np.com.lims.report.dto.ReportDtos.VerificationResult;
import np.com.lims.report.entity.ReportStatus;
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
@RequestMapping("/reports")
public class ReportController {

    private final ReportService service;

    public ReportController(ReportService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_REPORT_READ')")
    public PageResponse<ListItem> list(
            @RequestParam(required = false) ReportStatus status,
            @RequestParam(required = false) Long patientId,
            @RequestParam(required = false) String query,
            @PageableDefault(size = 20, sort = "generatedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return PageResponse.from(service.search(status, patientId, query, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_REPORT_READ')")
    public Detail get(@PathVariable Long id) {
        return service.get(id);
    }

    @GetMapping("/by-order/{orderId}")
    @PreAuthorize("hasAuthority('PERM_REPORT_READ')")
    public Detail getByOrder(@PathVariable Long orderId) {
        return service.getByOrder(orderId);
    }

    @PostMapping("/generate")
    @PreAuthorize("hasAuthority('PERM_REPORT_GENERATE')")
    public Detail generate(@Valid @RequestBody GenerateRequest request) {
        return service.generate(request.orderId(), request.preliminary());
    }

    @PostMapping("/{id}/release")
    @PreAuthorize("hasAuthority('PERM_REPORT_GENERATE')")
    public Detail release(@PathVariable Long id, @RequestBody(required = false) SignReleaseRequest request) {
        return service.release(id, request == null ? null : request.signerCredentials());
    }

    /** Confirm a report's authenticity from its verification token (printed on the report). */
    @GetMapping("/verify/{token}")
    @PreAuthorize("hasAuthority('PERM_REPORT_READ')")
    public VerificationResult verify(@PathVariable String token) {
        return service.verify(token);
    }

    @PostMapping("/{id}/deliver")
    @PreAuthorize("hasAuthority('PERM_REPORT_DELIVER')")
    public Detail deliver(@PathVariable Long id, @Valid @RequestBody DeliverRequest request) {
        return service.markDelivered(id, request.method(), request.recipient());
    }
}
