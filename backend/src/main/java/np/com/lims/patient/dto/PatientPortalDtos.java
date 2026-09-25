package np.com.lims.patient.dto;

import np.com.lims.billing.entity.Invoice;
import np.com.lims.billing.entity.InvoiceStatus;
import np.com.lims.report.entity.Report;
import np.com.lims.report.entity.ReportStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public final class PatientPortalDtos {

    private PatientPortalDtos() {
    }

    public record PortalSummary(
            String patientName,
            String patientMrn,
            List<PortalReportLine> reports,
            List<PortalInvoiceLine> invoices
    ) {
    }

    public record PortalReportLine(Long id, String reportNumber, String reportType, ReportStatus status, Instant releasedAt) {
        public static PortalReportLine from(Report r) {
            return new PortalReportLine(r.getId(), r.getReportNumber(), r.getReportType().name(), r.getStatus(), r.getReleasedAt());
        }
    }

    public record PortalInvoiceLine(Long id, String invoiceNumber, InvoiceStatus status, BigDecimal totalAmount,
                                    BigDecimal balance, Instant issuedAt) {
        public static PortalInvoiceLine from(Invoice i) {
            return new PortalInvoiceLine(i.getId(), i.getInvoiceNumber(), i.getStatus(), i.getTotalAmount(),
                    i.balance(), i.getIssuedAt());
        }
    }

    public record PortalLinkResponse(String url) {
    }
}
