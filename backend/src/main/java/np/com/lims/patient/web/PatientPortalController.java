package np.com.lims.patient.web;

import np.com.lims.billing.dto.BillingDtos;
import np.com.lims.patient.PatientPortalService;
import np.com.lims.patient.dto.PatientPortalDtos.PortalSummary;
import np.com.lims.report.dto.ReportDtos;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Public, unauthenticated — a real patient has no LabOS login. Reached only via the unguessable
 * per-patient token in the path (see {@code PatientPortalService}), the same pattern as
 * {@code ReportController.verify}; listed in {@code SecurityConfig.PUBLIC_ENDPOINTS}.
 */
@RestController
@RequestMapping("/patient-portal")
public class PatientPortalController {

    private final PatientPortalService service;

    public PatientPortalController(PatientPortalService service) {
        this.service = service;
    }

    @GetMapping("/{token}")
    public PortalSummary summary(@PathVariable String token) {
        return service.summary(token);
    }

    @GetMapping("/{token}/reports/{reportId}")
    public ReportDtos.Detail report(@PathVariable String token, @PathVariable Long reportId) {
        return service.report(token, reportId);
    }

    @GetMapping("/{token}/invoices/{invoiceId}")
    public BillingDtos.Detail invoice(@PathVariable String token, @PathVariable Long invoiceId) {
        return service.invoice(token, invoiceId);
    }
}
