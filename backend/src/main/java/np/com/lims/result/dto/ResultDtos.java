package np.com.lims.result.dto;

import np.com.lims.patient.PatientPrivacy;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import np.com.lims.catalog.entity.ParameterDataType;
import np.com.lims.result.entity.ContactMethod;
import np.com.lims.result.entity.CriticalValueCallback;
import np.com.lims.result.entity.ResultFlag;
import np.com.lims.result.entity.ResultStatus;
import np.com.lims.result.entity.ResultValue;
import np.com.lims.result.entity.ResultValueHistory;
import np.com.lims.result.entity.TestResult;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;

public final class ResultDtos {

    private ResultDtos() {
    }

    public record ValueInput(
            @NotNull Long parameterId,
            BigDecimal valueNumeric,
            @Size(max = 500) String valueText,
            @Size(max = 300) String comment
    ) {
    }

    public record SaveValuesRequest(
            @Valid List<ValueInput> values,
            @Size(max = 2000) String comment
    ) {
    }

    public record RejectRequest(@NotBlank @Size(max = 500) String reason) {
    }

    public record ApproveRequest(@Size(max = 300) String qcOverrideReason) {
    }

    public record CriticalCallbackRequest(
            @NotBlank @Size(max = 120) String notifiedName,
            @Size(max = 60) String notifiedRole,
            @NotNull ContactMethod contactMethod,
            boolean readBackConfirmed,
            @Size(max = 500) String remarks
    ) {
    }

    public record CallbackDto(
            Long id, String notifiedName, String notifiedRole, ContactMethod contactMethod,
            boolean readBackConfirmed, String remarks, boolean waived, String waivedReason,
            java.time.Instant notifiedAt, String loggedBy
    ) {
        public static CallbackDto from(CriticalValueCallback c) {
            return new CallbackDto(c.getId(), c.getNotifiedName(), c.getNotifiedRole(), c.getContactMethod(),
                    c.isReadBackConfirmed(), c.getRemarks(), c.isWaived(), c.getWaivedReason(),
                    c.getNotifiedAt(), c.getCreatedBy());
        }
    }

    public record AmendRequest(
            @Valid @NotNull List<ValueInput> values,
            @NotBlank @Size(max = 500) String reason,
            @Size(max = 2000) String comment
    ) {
    }

    public record ValueDto(
            Long id,
            Long parameterId,
            String parameterName,
            String unit,
            ParameterDataType dataType,
            int displayOrder,
            BigDecimal valueNumeric,
            String valueText,
            ResultFlag flag,
            String referenceText,
            boolean calculated,
            Integer decimalPlaces,
            java.util.List<String> allowedValues,
            String method,
            String groupHeading,
            BigDecimal previousValue,
            BigDecimal deltaPercent,
            boolean deltaBreach,
            String comment
    ) {
        static ValueDto from(ResultValue v) {
            return from(v, null);
        }

        /** {@code referenceHint} is the parameter's configured range text, shown before a value is entered. */
        static ValueDto from(ResultValue v, String referenceHint) {
            var p = v.getParameter();
            String reference = v.getReferenceText() != null ? v.getReferenceText() : referenceHint;
            return new ValueDto(v.getId(), p.getId(), v.getParameterName(), v.getParameterUnit(),
                    v.getDataType(), v.getDisplayOrder(), v.getValueNumeric(), v.getValueText(),
                    v.getFlag(), reference,
                    p.isCalculated(), p.getDecimalPlaces(), p.allowedValueList(), p.getMethod(), p.getGroupHeading(),
                    v.getPreviousValue(), v.getDeltaPercent(), v.isDeltaBreach(), v.getComment());
        }
    }

    public record HistoryDto(
            Long id,
            String parameterName,
            String oldValue,
            String newValue,
            String reason,
            String changedBy,
            Instant changedAt
    ) {
        static HistoryDto from(ResultValueHistory h) {
            return new HistoryDto(h.getId(), h.getParameterName(), h.getOldValue(), h.getNewValue(),
                    h.getReason(), h.getChangedBy(), h.getChangedAt());
        }
    }

    public record ListItem(
            Long id,
            Long orderId,
            String orderNumber,
            Long sampleId,
            String accessionNumber,
            Long patientId,
            String patientName,
            String patientMrn,
            String testCode,
            String testName,
            String departmentName,
            ResultStatus status,
            String priority,
            Instant dueAt,
            boolean overdue,
            boolean autoVerified,
            boolean criticalAckRequired,
            boolean hasAbnormal,
            boolean hasCritical,
            Instant createdAt
    ) {
        public static ListItem from(TestResult r) {
            return new ListItem(r.getId(), r.getOrder().getId(), r.getOrder().getOrderNumber(),
                    r.getSample().getId(), r.getSample().getAccessionNumber(),
                    r.getPatient().getId(), PatientPrivacy.displayName(r.getPatient()), r.getPatient().getMrn(),
                    r.getTestCode(), r.getTestName(), r.getDepartmentName(), r.getStatus(),
                    r.getPriority().name(), r.getDueAt(), r.isOverdue(), r.isAutoVerified(),
                    r.isCriticalAckRequired(), r.isHasAbnormal(), r.isHasCritical(), r.getCreatedAt());
        }
    }

    public record Detail(
            Long id,
            Long orderId,
            String orderNumber,
            Long sampleId,
            String accessionNumber,
            Long patientId,
            String patientName,
            String patientMrn,
            String patientGender,
            Integer patientAgeYears,
            Long testId,
            String testCode,
            String testName,
            String departmentName,
            ResultStatus status,
            String priority,
            Instant dueAt,
            boolean overdue,
            boolean autoVerified,
            String sampleCondition,
            boolean criticalAckRequired,
            List<CallbackDto> criticalCallbacks,
            String comment,
            boolean hasAbnormal,
            boolean hasCritical,
            String rejectionReason,
            Instant enteredAt, String enteredBy,
            Instant verifiedAt, String verifiedBy,
            Instant approvedAt, String approvedBy,
            Instant amendedAt, String amendedBy,
            List<ValueDto> values,
            List<HistoryDto> history
    ) {
        public static Detail from(TestResult r) {
            return from(r, List.of());
        }

        public static Detail from(TestResult r, List<CallbackDto> callbacks) {
            return from(r, callbacks, Map.of());
        }

        public static Detail from(TestResult r, List<CallbackDto> callbacks, Map<Long, String> referenceHints) {
            return new Detail(
                    r.getId(), r.getOrder().getId(), r.getOrder().getOrderNumber(),
                    r.getSample().getId(), r.getSample().getAccessionNumber(),
                    r.getPatient().getId(), PatientPrivacy.displayName(r.getPatient()), r.getPatient().getMrn(),
                    r.getPatient().getGender().name(), r.getPatient().ageYears(),
                    r.getTestId(), r.getTestCode(), r.getTestName(), r.getDepartmentName(),
                    r.getStatus(), r.getPriority().name(), r.getDueAt(), r.isOverdue(), r.isAutoVerified(),
                    sampleCondSummary(r), r.isCriticalAckRequired(), callbacks,
                    r.getComment(), r.isHasAbnormal(), r.isHasCritical(), r.getRejectionReason(),
                    r.getEnteredAt(), r.getEnteredBy(), r.getVerifiedAt(), r.getVerifiedBy(),
                    r.getApprovedAt(), r.getApprovedBy(), r.getAmendedAt(), r.getAmendedBy(),
                    r.getValues().stream()
                            .map(v -> ValueDto.from(v, referenceHints.get(v.getParameter().getId())))
                            .toList(),
                    r.getHistory().stream().map(HistoryDto::from).toList());
        }
    }

    private static String sampleCondSummary(TestResult r) {
        String sum = r.getSample() == null || r.getSample().getCondition() == null
                ? "" : r.getSample().getCondition().summary();
        return sum.isBlank() ? null : sum;
    }

    public record Summary(Map<String, Long> counts) {
    }
}
