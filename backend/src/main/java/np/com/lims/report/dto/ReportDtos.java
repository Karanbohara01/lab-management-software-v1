package np.com.lims.report.dto;

import np.com.lims.patient.PatientPrivacy;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import np.com.lims.report.entity.Report;
import np.com.lims.report.entity.ReportParameter;
import np.com.lims.report.entity.ReportStatus;
import np.com.lims.report.entity.ReportTest;
import np.com.lims.result.entity.ResultFlag;
import np.com.lims.settings.entity.LaboratoryProfile;

import java.time.Instant;
import java.util.List;

public final class ReportDtos {

    private ReportDtos() {
    }

    public record GenerateRequest(@NotNull Long orderId, boolean preliminary) {
    }

    public record SignReleaseRequest(@jakarta.validation.constraints.Size(max = 120) String signerCredentials) {
    }

    public record VerificationResult(
            boolean found, String reportNumber, int reportVersion, String reportType, String status,
            String patientMrn, java.time.Instant generatedAt, java.time.Instant releasedAt,
            String signedBy, String signerCredentials, java.time.Instant signedAt, String contentHash) {
        public static VerificationResult notFound() {
            return new VerificationResult(false, null, 0, null, null, null, null, null, null, null, null, null);
        }
    }

    public record DeliverRequest(
            @NotBlank @Size(max = 32) String method,
            @Size(max = 200) String recipient
    ) {
    }

    public record LabHeader(
            String name, String addressLine, String city, String phone, String email,
            String panNumber, String reportFooter, String logoDataUri
    ) {
        static LabHeader from(LaboratoryProfile p) {
            return new LabHeader(p.getName(), p.getAddressLine(), p.getCity(), p.getPhone(), p.getEmail(),
                    p.getPanNumber(), p.getReportFooter(), p.getLogoDataUri());
        }
    }

    public record ParameterLine(
            String name, String unit, String value, ResultFlag flag, String referenceText, String comment
    ) {
        static ParameterLine from(ReportParameter p) {
            return new ParameterLine(p.getName(), p.getUnit(), p.getValueDisplay(), p.getFlag(),
                    p.getReferenceText(), p.getComment());
        }
    }

    public record TestBlock(
            String testCode, String testName, String departmentName, String method, String specimen,
            String accessionNumber, String comment, String verifiedBy, String approvedBy, Instant approvedAt,
            List<ParameterLine> parameters
    ) {
        static TestBlock from(ReportTest t) {
            return new TestBlock(t.getTestCode(), t.getTestName(), t.getDepartmentName(), t.getMethod(),
                    t.getSpecimen(), t.getAccessionNumber(), t.getComment(), t.getVerifiedBy(), t.getApprovedBy(),
                    t.getApprovedAt(), t.getParameters().stream().map(ParameterLine::from).toList());
        }
    }

    public record ListItem(
            Long id, String reportNumber, Long orderId, String orderNumber,
            Long patientId, String patientName, String patientMrn,
            ReportStatus status, String reportType, int reportVersion, int testCount, boolean hasCritical, Instant generatedAt
    ) {
        public static ListItem from(Report r) {
            return new ListItem(r.getId(), r.getReportNumber(), r.getOrder().getId(), r.getOrder().getOrderNumber(),
                    r.getPatient().getId(), PatientPrivacy.displayName(r.getPatient()), r.getPatient().getMrn(),
                    r.getStatus(), r.getReportType().name(), r.getReportVersion(), r.getTests().size(),
                    r.hasCritical(), r.getGeneratedAt());
        }
    }

    public record Detail(
            Long id, String reportNumber, Long orderId, String orderNumber,
            Long patientId, String patientName, String patientMrn, String patientGender, Integer patientAgeYears,
            String referringDoctorName,
            ReportStatus status, String reportType, int reportVersion, boolean hasCritical,
            String verificationToken, String contentHash, String signedBy, String signerCredentials, Instant signedAt,
            Instant generatedAt, String generatedBy,
            Instant releasedAt, String releasedBy,
            Instant deliveredAt, String deliveredBy, String deliveryMethod, String deliveryRecipient,
            LabHeader laboratory,
            List<TestBlock> tests
    ) {
        public static Detail from(Report r, LaboratoryProfile lab) {
            return new Detail(
                    r.getId(), r.getReportNumber(), r.getOrder().getId(), r.getOrder().getOrderNumber(),
                    r.getPatient().getId(), PatientPrivacy.displayName(r.getPatient()), r.getPatient().getMrn(),
                    r.getPatient().getGender().name(), r.getPatient().ageYears(),
                    r.getReferringDoctorName(),
                    r.getStatus(), r.getReportType().name(), r.getReportVersion(), r.hasCritical(),
                    r.getVerificationToken(), r.getContentHash(), r.getSignedBy(), r.getSignerCredentials(), r.getSignedAt(),
                    r.getGeneratedAt(), r.getGeneratedBy(),
                    r.getReleasedAt(), r.getReleasedBy(),
                    r.getDeliveredAt(), r.getDeliveredBy(), r.getDeliveryMethod(), r.getDeliveryRecipient(),
                    LabHeader.from(lab),
                    r.getTests().stream().map(TestBlock::from).toList());
        }
    }
}
