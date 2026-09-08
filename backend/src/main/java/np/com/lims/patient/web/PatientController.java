package np.com.lims.patient.web;

import jakarta.validation.Valid;
import np.com.lims.common.api.PageResponse;
import np.com.lims.patient.PatientMergeService;
import np.com.lims.patient.PatientService;
import np.com.lims.patient.dto.PatientDtos.Detail;
import np.com.lims.patient.dto.PatientDtos.ListItem;
import np.com.lims.patient.dto.PatientDtos.MatchCandidate;
import np.com.lims.patient.dto.PatientDtos.MatchRequest;
import np.com.lims.patient.dto.PatientDtos.MergePreview;
import np.com.lims.patient.dto.PatientDtos.MergeRequest;
import np.com.lims.patient.dto.PatientDtos.UpsertRequest;
import np.com.lims.patient.entity.IdentifierType;
import np.com.lims.patient.entity.PatientCategory;
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

import java.util.List;

@RestController
@RequestMapping("/patients")
public class PatientController {

    private final PatientService service;
    private final PatientMergeService mergeService;

    public PatientController(PatientService service, PatientMergeService mergeService) {
        this.service = service;
        this.mergeService = mergeService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_PATIENT_READ')")
    public PageResponse<ListItem> list(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) PatientCategory category,
            @RequestParam(defaultValue = "true") boolean activeOnly,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return PageResponse.from(service.search(query, category, activeOnly, pageable));
    }

    /** Real-time duplicate detection for the registration screen. */
    @PostMapping("/match")
    @PreAuthorize("hasAuthority('PERM_PATIENT_READ')")
    public List<MatchCandidate> match(@Valid @RequestBody MatchRequest request) {
        return service.findPotentialDuplicates(request);
    }

    @GetMapping("/by-identifier")
    @PreAuthorize("hasAuthority('PERM_PATIENT_READ')")
    public List<ListItem> byIdentifier(@RequestParam IdentifierType type, @RequestParam String value) {
        return service.findByIdentifier(type, value);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_PATIENT_READ')")
    public Detail get(@PathVariable Long id) {
        return service.view(id);
    }

    @GetMapping("/{id}/merge-preview")
    @PreAuthorize("hasAuthority('PERM_PATIENT_MERGE')")
    public MergePreview mergePreview(@PathVariable Long id, @RequestParam Long duplicateId) {
        return mergeService.preview(id, duplicateId);
    }

    /** Merge {@code duplicateId} into the patient at {@code id} (the survivor). */
    @PostMapping("/{id}/merge")
    @PreAuthorize("hasAuthority('PERM_PATIENT_MERGE')")
    public Detail merge(@PathVariable Long id, @Valid @RequestBody MergeRequest request) {
        return mergeService.merge(id, request);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('PERM_PATIENT_WRITE')")
    public Detail register(@Valid @RequestBody UpsertRequest request) {
        return service.register(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_PATIENT_WRITE')")
    public Detail update(@PathVariable Long id, @Valid @RequestBody UpsertRequest request) {
        return service.update(id, request);
    }

    @PatchMapping("/{id}/active")
    @PreAuthorize("hasAuthority('PERM_PATIENT_WRITE')")
    public Detail setActive(@PathVariable Long id, @RequestParam boolean value) {
        service.setActive(id, value);
        return service.get(id);
    }
}
