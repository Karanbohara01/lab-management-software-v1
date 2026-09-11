package np.com.lims.catalog.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import np.com.lims.catalog.entity.AgeUnit;
import np.com.lims.catalog.entity.LabTest;
import np.com.lims.catalog.entity.ParameterDataType;
import np.com.lims.catalog.entity.RangeGender;
import np.com.lims.catalog.entity.ResultMode;
import np.com.lims.catalog.entity.ReferenceRange;
import np.com.lims.catalog.entity.SpecimenType;
import np.com.lims.catalog.entity.TestParameter;
import np.com.lims.catalog.entity.TestType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public final class TestDtos {

    private TestDtos() {
    }

    // ----- requests -------------------------------------------------------

    public record RangeRequest(
            @NotNull RangeGender appliesToGender,
            @Min(0) Integer ageLow,
            @Min(0) Integer ageHigh,
            AgeUnit ageUnit,
            boolean appliesToPregnant,
            LocalDate effectiveFrom,
            @Size(max = 200) String source,
            BigDecimal lowValue,
            BigDecimal highValue,
            @Size(max = 120) String normalText,
            BigDecimal criticalLow,
            BigDecimal criticalHigh
    ) {
    }

    public record ParameterRequest(
            @Size(max = 32) String code,
            @NotBlank @Size(max = 160) String name,
            @Size(max = 32) String unit,
            @NotNull ParameterDataType dataType,
            @PositiveOrZero int displayOrder,
            @Min(0) Integer decimalPlaces,
            @Size(max = 500) String calculationFormula,
            @Size(max = 500) String allowedValues,
            BigDecimal absurdLow,
            BigDecimal absurdHigh,
            @Size(max = 120) String method,
            @Size(max = 20) String loincCode,
            @Size(max = 120) String groupHeading,
            BigDecimal deltaCheckPercent,
            @Valid List<RangeRequest> referenceRanges
    ) {
    }

    public record SpecimenHandling(
            @Size(max = 60) String containerType,
            BigDecimal minVolumeMl,
            @Size(max = 300) String stabilityNote,
            boolean fastingRequired,
            @Min(0) Integer fastingHours,
            boolean referral,
            @Size(max = 160) String referralLab
    ) {
        public static final SpecimenHandling EMPTY =
                new SpecimenHandling(null, null, null, false, null, false, null);
    }

    public record CreateRequest(
            @NotBlank @Size(max = 32) @Pattern(regexp = "[A-Za-z0-9._-]+",
                    message = "Code may only contain letters, digits, . - _") String code,
            @NotBlank @Size(max = 160) String name,
            @NotNull TestType type,
            ResultMode resultMode,
            @NotNull Long departmentId,
            @Size(max = 80) String category,
            @NotNull SpecimenType specimenType,
            @Size(max = 500) String specimenRequirements,
            @Size(max = 120) String method,
            @Size(max = 20) String loincCode,
            @NotNull @DecimalMin("0.0") BigDecimal price,
            @Min(0) Integer turnaroundHours,
            @Valid SpecimenHandling specimenHandling,
            boolean autoVerifyEnabled,
            @Valid List<ParameterRequest> parameters,
            List<Long> memberTestIds
    ) {
    }

    public record UpdateRequest(
            @NotBlank @Size(max = 160) String name,
            @NotNull TestType type,
            ResultMode resultMode,
            @NotNull Long departmentId,
            @Size(max = 80) String category,
            @NotNull SpecimenType specimenType,
            @Size(max = 500) String specimenRequirements,
            @Size(max = 120) String method,
            @Size(max = 20) String loincCode,
            @NotNull @DecimalMin("0.0") BigDecimal price,
            @Min(0) Integer turnaroundHours,
            @Valid SpecimenHandling specimenHandling,
            boolean autoVerifyEnabled,
            @Valid List<ParameterRequest> parameters,
            List<Long> memberTestIds
    ) {
    }

    // ----- responses ----------------------------------------------------

    public record RangeResponse(
            RangeGender appliesToGender,
            Integer ageLow,
            Integer ageHigh,
            AgeUnit ageUnit,
            boolean appliesToPregnant,
            LocalDate effectiveFrom,
            String source,
            BigDecimal lowValue,
            BigDecimal highValue,
            String normalText,
            BigDecimal criticalLow,
            BigDecimal criticalHigh
    ) {
        static RangeResponse from(ReferenceRange r) {
            return new RangeResponse(r.getAppliesToGender(), r.getAgeLow(), r.getAgeHigh(), r.getAgeUnit(),
                    r.isAppliesToPregnant(), r.getEffectiveFrom(), r.getSource(),
                    r.getLowValue(), r.getHighValue(), r.getNormalText(), r.getCriticalLow(), r.getCriticalHigh());
        }
    }

    public record ParameterResponse(
            Long id,
            String code,
            String name,
            String unit,
            ParameterDataType dataType,
            int displayOrder,
            Integer decimalPlaces,
            String calculationFormula,
            String allowedValues,
            BigDecimal absurdLow,
            BigDecimal absurdHigh,
            String method,
            String loincCode,
            String groupHeading,
            BigDecimal deltaCheckPercent,
            boolean calculated,
            List<RangeResponse> referenceRanges
    ) {
        static ParameterResponse from(TestParameter p) {
            return new ParameterResponse(p.getId(), p.getCode(), p.getName(), p.getUnit(), p.getDataType(),
                    p.getDisplayOrder(), p.getDecimalPlaces(), p.getCalculationFormula(), p.getAllowedValues(),
                    p.getAbsurdLow(), p.getAbsurdHigh(), p.getMethod(), p.getLoincCode(), p.getGroupHeading(),
                    p.getDeltaCheckPercent(), p.isCalculated(),
                    p.getReferenceRanges().stream().map(RangeResponse::from).toList());
        }
    }

    public record MemberTest(Long id, String code, String name, String departmentName, BigDecimal price) {
        static MemberTest from(LabTest t) {
            return new MemberTest(t.getId(), t.getCode(), t.getName(), t.getDepartment().getName(), t.getPrice());
        }
    }

    public record ListItem(
            Long id,
            String code,
            String name,
            TestType type,
            ResultMode resultMode,
            Long departmentId,
            String departmentName,
            String category,
            SpecimenType specimenType,
            BigDecimal price,
            Integer turnaroundHours,
            boolean referral,
            int parameterCount,
            int memberCount,
            boolean active
    ) {
        public static ListItem from(LabTest t) {
            return new ListItem(t.getId(), t.getCode(), t.getName(), t.getType(), t.getResultMode(),
                    t.getDepartment().getId(), t.getDepartment().getName(), t.getCategory(),
                    t.getSpecimenType(), t.getPrice(), t.getTurnaroundHours(), t.isReferral(),
                    t.getParameters().size(), t.getProfileMembers().size(), t.isActive());
        }
    }

    public record Detail(
            Long id,
            String code,
            String name,
            TestType type,
            ResultMode resultMode,
            Long departmentId,
            String departmentName,
            String category,
            SpecimenType specimenType,
            String specimenRequirements,
            String method,
            String loincCode,
            BigDecimal price,
            Integer turnaroundHours,
            SpecimenHandling specimenHandling,
            boolean autoVerifyEnabled,
            boolean active,
            List<ParameterResponse> parameters,
            List<MemberTest> members
    ) {
        public static Detail from(LabTest t) {
            SpecimenHandling handling = new SpecimenHandling(
                    t.getContainerType(), t.getMinVolumeMl(), t.getStabilityNote(),
                    t.isFastingRequired(), t.getFastingHours(), t.isReferral(), t.getReferralLab());
            return new Detail(t.getId(), t.getCode(), t.getName(), t.getType(), t.getResultMode(),
                    t.getDepartment().getId(), t.getDepartment().getName(), t.getCategory(),
                    t.getSpecimenType(), t.getSpecimenRequirements(), t.getMethod(), t.getLoincCode(), t.getPrice(),
                    t.getTurnaroundHours(), handling, t.isAutoVerifyEnabled(), t.isActive(),
                    t.getParameters().stream().map(ParameterResponse::from).toList(),
                    t.getProfileMembers().stream().map(m -> MemberTest.from(m.getMember())).toList());
        }
    }
}
