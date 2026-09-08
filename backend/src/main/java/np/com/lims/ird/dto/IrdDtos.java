package np.com.lims.ird.dto;

import np.com.lims.patient.PatientPrivacy;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import np.com.lims.ird.entity.IrdStatus;
import np.com.lims.ird.entity.IrdSubmission;
import np.com.lims.ird.entity.IrdSubmissionAttempt;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public final class IrdDtos {

    private IrdDtos() {
    }

    public record SubmitRequest(@NotNull Long invoiceId) {
    }

    public record ManualRequest(
            @NotBlank @Size(max = 120) String reference,
            @Size(max = 1000) String note
    ) {
    }

    public record CancelRequest(@NotBlank @Size(max = 500) String reason) {
    }

    public record ConfigResponse(
            boolean enabled,
            String environment,
            boolean officiallyCertified,
            String message
    ) {
    }

    public record AttemptDto(
            Long id,
            int attemptNo,
            IrdSubmissionAttempt.Action action,
            IrdSubmissionAttempt.RequestStatus requestStatus,
            IrdSubmissionAttempt.ResponseStatus responseStatus,
            String providerReference,
            String errorCode,
            String errorMessage,
            String actor,
            Instant occurredAt
    ) {
        static AttemptDto from(IrdSubmissionAttempt a) {
            return new AttemptDto(a.getId(), a.getAttemptNo(), a.getAction(), a.getRequestStatus(),
                    a.getResponseStatus(), a.getProviderReference(), a.getErrorCode(), a.getErrorMessage(),
                    a.getActor(), a.getOccurredAt());
        }
    }

    public record ListItem(
            Long id,
            Long invoiceId,
            String invoiceNumber,
            Long patientId,
            String patientName,
            IrdStatus status,
            int attemptCount,
            boolean manual,
            String lastErrorMessage,
            Instant submittedAt,
            Instant updatedAt
    ) {
        public static ListItem from(IrdSubmission s) {
            return new ListItem(s.getId(), s.getInvoice().getId(), s.getInvoice().getInvoiceNumber(),
                    s.getInvoice().getPatient().getId(), PatientPrivacy.displayName(s.getInvoice().getPatient()),
                    s.getStatus(), s.getAttemptCount(), s.isManual(), s.getLastErrorMessage(),
                    s.getSubmittedAt(), s.getUpdatedAt());
        }
    }

    public record Detail(
            Long id,
            Long invoiceId,
            String invoiceNumber,
            Long patientId,
            String patientName,
            String patientMrn,
            IrdStatus status,
            String providerReference,
            String lastErrorCode,
            String lastErrorMessage,
            int attemptCount,
            boolean manual,
            String manualReference,
            String notes,
            Instant submittedAt,
            Instant acceptedAt,
            List<AttemptDto> attempts
    ) {
        public static Detail from(IrdSubmission s) {
            return new Detail(
                    s.getId(), s.getInvoice().getId(), s.getInvoice().getInvoiceNumber(),
                    s.getInvoice().getPatient().getId(), PatientPrivacy.displayName(s.getInvoice().getPatient()),
                    s.getInvoice().getPatient().getMrn(),
                    s.getStatus(), s.getProviderReference(), s.getLastErrorCode(), s.getLastErrorMessage(),
                    s.getAttemptCount(), s.isManual(), s.getManualReference(), s.getNotes(),
                    s.getSubmittedAt(), s.getAcceptedAt(),
                    s.getAttempts().stream().map(AttemptDto::from).toList());
        }
    }

    public record Summary(Map<String, Long> counts) {
    }
}
