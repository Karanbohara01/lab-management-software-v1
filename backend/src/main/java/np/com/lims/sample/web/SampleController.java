package np.com.lims.sample.web;

import jakarta.validation.Valid;
import np.com.lims.common.api.PageResponse;
import np.com.lims.sample.SampleService;
import np.com.lims.sample.dto.SampleDtos.CollectRequest;
import np.com.lims.sample.dto.SampleDtos.Detail;
import np.com.lims.sample.dto.SampleDtos.ListItem;
import np.com.lims.sample.dto.SampleDtos.NoteRequest;
import np.com.lims.sample.dto.SampleDtos.ReceiveRequest;
import np.com.lims.sample.dto.SampleDtos.RecollectRequest;
import np.com.lims.sample.dto.SampleDtos.RejectRequest;
import np.com.lims.sample.dto.SampleDtos.StatusSummary;
import np.com.lims.sample.entity.SampleStatus;
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
@RequestMapping("/samples")
public class SampleController {

    private final SampleService service;

    public SampleController(SampleService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_SAMPLE_READ')")
    public PageResponse<ListItem> list(
            @RequestParam(required = false) SampleStatus status,
            @RequestParam(required = false) Long orderId,
            @RequestParam(required = false) Long patientId,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) String query,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return PageResponse.from(service.search(status, orderId, patientId, departmentId, query, pageable));
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAuthority('PERM_SAMPLE_READ')")
    public StatusSummary summary() {
        return service.statusSummary();
    }

    @GetMapping("/lookup")
    @PreAuthorize("hasAuthority('PERM_SAMPLE_READ')")
    public Detail lookup(@RequestParam String code) {
        return service.lookup(code);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_SAMPLE_READ')")
    public Detail get(@PathVariable Long id) {
        return service.get(id);
    }

    @PostMapping("/{id}/collect")
    @PreAuthorize("hasAuthority('PERM_SAMPLE_COLLECT')")
    public Detail collect(@PathVariable Long id, @Valid @RequestBody(required = false) CollectRequest request) {
        return service.collect(id, request == null ? new CollectRequest(null, null, null) : request);
    }

    @PostMapping("/{id}/receive")
    @PreAuthorize("hasAuthority('PERM_SAMPLE_RECEIVE')")
    public Detail receive(@PathVariable Long id, @Valid @RequestBody(required = false) ReceiveRequest request) {
        return service.receive(id, request == null ? null : request.note(),
                request == null ? null : request.condition());
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAuthority('PERM_SAMPLE_REJECT')")
    public Detail reject(@PathVariable Long id, @Valid @RequestBody RejectRequest request) {
        return service.reject(id, request.reason());
    }

    @PostMapping("/{id}/recollect")
    @PreAuthorize("hasAuthority('PERM_SAMPLE_REJECT')")
    public Detail recollect(@PathVariable Long id, @Valid @RequestBody(required = false) RecollectRequest request) {
        return service.recollect(id, request == null ? null : request.note());
    }

    @PostMapping("/{id}/notes")
    @PreAuthorize("hasAuthority('PERM_SAMPLE_READ')")
    public Detail addNote(@PathVariable Long id, @Valid @RequestBody NoteRequest request) {
        return service.addNote(id, request.note());
    }
}
