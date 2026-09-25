package np.com.lims.commission.web;

import jakarta.validation.Valid;
import np.com.lims.commission.CommissionService;
import np.com.lims.commission.dto.CommissionDtos.DoctorSummary;
import np.com.lims.commission.dto.CommissionDtos.EntryRow;
import np.com.lims.commission.dto.CommissionDtos.PayoutRequest;
import np.com.lims.commission.dto.CommissionDtos.PayoutRow;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/commissions")
public class CommissionController {

    private final CommissionService service;

    public CommissionController(CommissionService service) {
        this.service = service;
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAuthority('PERM_COMMISSION_READ')")
    public List<DoctorSummary> summary() {
        return service.summary();
    }

    @GetMapping("/doctors/{doctorId}/entries")
    @PreAuthorize("hasAuthority('PERM_COMMISSION_READ')")
    public List<EntryRow> entries(@PathVariable Long doctorId) {
        return service.entriesForDoctor(doctorId);
    }

    @GetMapping("/doctors/{doctorId}/payouts")
    @PreAuthorize("hasAuthority('PERM_COMMISSION_READ')")
    public List<PayoutRow> payouts(@PathVariable Long doctorId) {
        return service.payoutsForDoctor(doctorId);
    }

    @PostMapping("/payouts")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('PERM_COMMISSION_MANAGE')")
    public PayoutRow recordPayout(@Valid @RequestBody PayoutRequest request) {
        return service.recordPayout(request);
    }
}
