package np.com.lims.patient;

import np.com.lims.billing.InvoiceRepository;
import np.com.lims.billing.dto.BillingDtos;
import np.com.lims.billing.entity.Invoice;
import np.com.lims.billing.entity.InvoiceStatus;
import np.com.lims.common.exception.ApiException;
import np.com.lims.patient.dto.PatientPortalDtos.PortalInvoiceLine;
import np.com.lims.patient.dto.PatientPortalDtos.PortalLinkResponse;
import np.com.lims.patient.dto.PatientPortalDtos.PortalReportLine;
import np.com.lims.patient.dto.PatientPortalDtos.PortalSummary;
import np.com.lims.patient.entity.Patient;
import np.com.lims.report.ReportRepository;
import np.com.lims.report.dto.ReportDtos;
import np.com.lims.report.entity.Report;
import np.com.lims.report.entity.ReportStatus;
import np.com.lims.settings.LaboratoryProfileService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumSet;
import java.util.List;

/**
 * Patient self-service portal: a real patient has no LabOS login, so every method here is reached
 * through a durable, unguessable per-patient token (see {@link Patient#getPortalToken()}) rather
 * than Spring Security authentication — the same trust model {@code ReportService.verify} already
 * uses for the report-verification link, just scoped to a whole patient's history instead of one
 * report. Deliberately narrow: only fully authorized reports (RELEASED/DELIVERED, never a
 * preliminary/unreleased GENERATED one) and only non-draft invoices are ever visible here, and
 * every id-scoped lookup double-checks the resolved patient actually owns that report/invoice
 * before returning it — a token is per-patient, not a blanket "any report" key.
 */
@Service
public class PatientPortalService {

    private final PatientRepository patientRepository;
    private final ReportRepository reportRepository;
    private final InvoiceRepository invoiceRepository;
    private final LaboratoryProfileService laboratoryProfileService;
    private final String publicUrl;

    private static final EnumSet<ReportStatus> VISIBLE_REPORT_STATUSES =
            EnumSet.of(ReportStatus.RELEASED, ReportStatus.DELIVERED);

    public PatientPortalService(PatientRepository patientRepository, ReportRepository reportRepository,
                                InvoiceRepository invoiceRepository, LaboratoryProfileService laboratoryProfileService,
                                @Value("${lims.app.public-url}") String publicUrl) {
        this.patientRepository = patientRepository;
        this.reportRepository = reportRepository;
        this.invoiceRepository = invoiceRepository;
        this.laboratoryProfileService = laboratoryProfileService;
        this.publicUrl = publicUrl;
    }

    /**
     * Generates the patient's portal token the first time it's needed (e.g. a staff member
     * clicking "Copy portal link" on the patient page) and returns the existing one on every
     * later call — never rotates an existing token, since that would silently break any link
     * already shared with the patient.
     */
    @Transactional
    public PortalLinkResponse linkFor(Long patientId) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> ApiException.notFound("Patient", patientId));
        if (patient.getPortalToken() == null) {
            patient.setPortalToken(newToken());
        }
        return new PortalLinkResponse(publicUrl.replaceAll("/+$", "") + "/portal/" + patient.getPortalToken());
    }

    @Transactional(readOnly = true)
    public PortalSummary summary(String token) {
        Patient patient = resolve(token);
        List<PortalReportLine> reports = reportRepository
                .findByPatientIdAndStatusInOrderByGeneratedAtDesc(patient.getId(), VISIBLE_REPORT_STATUSES)
                .stream().map(PortalReportLine::from).toList();
        List<PortalInvoiceLine> invoices = invoiceRepository
                .findByPatientIdAndStatusNotOrderByCreatedAtDesc(patient.getId(), InvoiceStatus.DRAFT)
                .stream().map(PortalInvoiceLine::from).toList();
        return new PortalSummary(patient.getFullName(), patient.getMrn(), reports, invoices);
    }

    @Transactional(readOnly = true)
    public ReportDtos.Detail report(String token, Long reportId) {
        Patient patient = resolve(token);
        Report report = reportRepository.findDetailedById(reportId)
                .orElseThrow(() -> ApiException.notFound("Report", reportId));
        if (!patient.getId().equals(report.getPatient().getId()) || !VISIBLE_REPORT_STATUSES.contains(report.getStatus())) {
            throw ApiException.notFound("Report", reportId);
        }
        return ReportDtos.Detail.from(report, laboratoryProfile(patient));
    }

    @Transactional(readOnly = true)
    public BillingDtos.Detail invoice(String token, Long invoiceId) {
        Patient patient = resolve(token);
        Invoice invoice = invoiceRepository.findDetailedById(invoiceId)
                .orElseThrow(() -> ApiException.notFound("Invoice", invoiceId));
        if (!patient.getId().equals(invoice.getPatient().getId()) || invoice.getStatus() == InvoiceStatus.DRAFT) {
            throw ApiException.notFound("Invoice", invoiceId);
        }
        return BillingDtos.Detail.from(invoice, laboratoryProfile(patient));
    }

    private Patient resolve(String token) {
        return patientRepository.findByPortalToken(token)
                .orElseThrow(() -> ApiException.notFound("Patient portal link", token));
    }

    /**
     * {@code LaboratoryProfileService.require()} reads the caller's organization from
     * {@link np.com.lims.common.tenant.TenantContext}, which is only ever populated by
     * {@code TenantFilterInterceptor} from an authenticated principal — this portal path is
     * deliberately unauthenticated, so nothing sets it. Scope it manually here, just for this one
     * lookup, from the already-resolved (and already ownership-checked) patient's own
     * organization — never left set afterward, since this thread is pooled and reused.
     */
    private np.com.lims.settings.entity.LaboratoryProfile laboratoryProfile(Patient patient) {
        np.com.lims.common.tenant.TenantContext.set(patient.getOrganizationId());
        try {
            return laboratoryProfileService.require();
        } finally {
            np.com.lims.common.tenant.TenantContext.clear();
        }
    }

    private static String newToken() {
        byte[] b = new byte[16];
        new java.security.SecureRandom().nextBytes(b);
        StringBuilder sb = new StringBuilder();
        for (byte x : b) sb.append(String.format("%02x", x));
        return sb.toString();
    }
}
