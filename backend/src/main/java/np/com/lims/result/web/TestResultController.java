package np.com.lims.result.web;

import jakarta.validation.Valid;
import np.com.lims.common.api.PageResponse;
import np.com.lims.result.TestResultService;
import np.com.lims.result.dto.ResultDtos.AmendRequest;
import np.com.lims.result.dto.ResultDtos.ApproveRequest;
import np.com.lims.result.dto.ResultDtos.CriticalCallbackRequest;
import np.com.lims.result.dto.ResultDtos.CultureRequest;
import np.com.lims.result.dto.ResultDtos.Detail;
import np.com.lims.result.dto.ResultDtos.ListItem;
import np.com.lims.result.dto.ResultDtos.RejectRequest;
import np.com.lims.result.dto.ResultDtos.SaveValuesRequest;
import np.com.lims.result.dto.ResultDtos.Summary;
import np.com.lims.result.dto.ResultDtos.VerifyRequest;
import np.com.lims.result.entity.ResultStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/results")
public class TestResultController {

    private final TestResultService service;

    public TestResultController(TestResultService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_RESULT_READ')")
    public PageResponse<ListItem> list(
            @RequestParam(required = false) ResultStatus status,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Long sampleId,
            @RequestParam(required = false) Long orderId,
            @RequestParam(required = false) Long patientId,
            @RequestParam(defaultValue = "false") boolean criticalOnly,
            @RequestParam(defaultValue = "false") boolean overdueOnly,
            @RequestParam(defaultValue = "false") boolean criticalPendingOnly,
            @RequestParam(required = false) String query,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return PageResponse.from(service.search(status, departmentId, sampleId, orderId, patientId,
                criticalOnly, overdueOnly, criticalPendingOnly, query, pageable));
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAuthority('PERM_RESULT_READ')")
    public Summary summary(@RequestParam(required = false) Long departmentId) {
        return service.summary(departmentId);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_RESULT_READ')")
    public Detail get(@PathVariable Long id) {
        return service.get(id);
    }

    @PutMapping("/{id}/values")
    @PreAuthorize("hasAuthority('PERM_RESULT_ENTER')")
    public Detail saveValues(@PathVariable Long id, @Valid @RequestBody SaveValuesRequest request) {
        return service.saveValues(id, request);
    }

    /** Enter a microbiology culture & sensitivity result (growth outcome + isolates + AST panel). */
    @PutMapping("/{id}/culture")
    @PreAuthorize("hasAuthority('PERM_RESULT_ENTER')")
    public Detail saveCulture(@PathVariable Long id, @Valid @RequestBody CultureRequest request) {
        return service.saveCulture(id, request);
    }

    @PostMapping("/{id}/verify")
    @PreAuthorize("hasAuthority('PERM_RESULT_VERIFY')")
    public Detail verify(@PathVariable Long id, @RequestBody(required = false) VerifyRequest request) {
        return service.verify(id, request);
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAuthority('PERM_RESULT_APPROVE')")
    public Detail approve(@PathVariable Long id, @RequestBody(required = false) ApproveRequest request) {
        return service.approve(id, request);
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAuthority('PERM_RESULT_VERIFY')")
    public Detail reject(@PathVariable Long id, @Valid @RequestBody RejectRequest request) {
        return service.reject(id, request.reason());
    }

    @PostMapping("/{id}/amend")
    @PreAuthorize("hasAuthority('PERM_RESULT_AMEND')")
    public Detail amend(@PathVariable Long id, @Valid @RequestBody AmendRequest request) {
        return service.amend(id, request);
    }

    /** Record a read-back notification of a critical value to the treating clinician / ward. */
    @PostMapping("/{id}/critical-callback")
    @PreAuthorize("hasAuthority('PERM_RESULT_READ')")
    public Detail logCriticalCallback(@PathVariable Long id, @Valid @RequestBody CriticalCallbackRequest request) {
        return service.logCriticalCallback(id, request);
    }

    @PostMapping("/{id}/critical-callback/waive")
    @PreAuthorize("hasAuthority('PERM_RESULT_APPROVE')")
    public Detail waiveCriticalCallback(@PathVariable Long id, @Valid @RequestBody RejectRequest request) {
        return service.waiveCriticalCallback(id, request.reason());
    }
}
