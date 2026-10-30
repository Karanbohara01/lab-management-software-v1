package np.com.lims.appointment.web;

import jakarta.validation.Valid;
import np.com.lims.appointment.AppointmentService;
import np.com.lims.appointment.dto.AppointmentDtos.CancelRequest;
import np.com.lims.appointment.dto.AppointmentDtos.ConvertRequest;
import np.com.lims.appointment.dto.AppointmentDtos.Detail;
import np.com.lims.appointment.dto.AppointmentDtos.ListItem;
import np.com.lims.appointment.dto.AppointmentDtos.SaveRequest;
import np.com.lims.appointment.entity.AppointmentStatus;
import np.com.lims.common.api.PageResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
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

import java.time.Instant;

@RestController
@RequestMapping("/appointments")
public class AppointmentController {

    private final AppointmentService service;

    public AppointmentController(AppointmentService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_APPOINTMENT_READ')")
    public PageResponse<ListItem> list(
            @RequestParam(required = false) Long patientId,
            @RequestParam(required = false) AppointmentStatus status,
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant scheduledFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant scheduledTo,
            @RequestParam(required = false) String query,
            @PageableDefault(size = 20, sort = "scheduledAt", direction = Sort.Direction.ASC) Pageable pageable) {
        return PageResponse.from(service.search(patientId, status, branchId, scheduledFrom, scheduledTo, query, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_APPOINTMENT_READ')")
    public Detail get(@PathVariable Long id) {
        return service.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('PERM_APPOINTMENT_WRITE')")
    public Detail create(@Valid @RequestBody SaveRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_APPOINTMENT_WRITE')")
    public Detail update(@PathVariable Long id, @Valid @RequestBody SaveRequest request) {
        return service.update(id, request);
    }

    @PostMapping("/{id}/check-in")
    @PreAuthorize("hasAuthority('PERM_APPOINTMENT_WRITE')")
    public Detail checkIn(@PathVariable Long id) {
        return service.checkIn(id);
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAuthority('PERM_APPOINTMENT_WRITE')")
    public Detail cancel(@PathVariable Long id, @Valid @RequestBody(required = false) CancelRequest request) {
        return service.cancel(id, request == null ? null : request.reason());
    }

    @PostMapping("/{id}/no-show")
    @PreAuthorize("hasAuthority('PERM_APPOINTMENT_WRITE')")
    public Detail noShow(@PathVariable Long id) {
        return service.markNoShow(id);
    }

    @PostMapping("/{id}/convert")
    @PreAuthorize("hasAuthority('PERM_APPOINTMENT_WRITE')")
    public Detail convert(@PathVariable Long id, @Valid @RequestBody ConvertRequest request) {
        return service.markConverted(id, request.orderId());
    }
}
