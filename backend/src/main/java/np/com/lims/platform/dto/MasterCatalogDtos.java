package np.com.lims.platform.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import np.com.lims.catalog.entity.ParameterDataType;
import np.com.lims.catalog.entity.RangeGender;
import np.com.lims.catalog.entity.SpecimenType;
import np.com.lims.platform.entity.MasterLabTest;
import np.com.lims.platform.entity.MasterReferenceRange;
import np.com.lims.platform.entity.MasterTestParameter;

import java.math.BigDecimal;
import java.util.List;

public final class MasterCatalogDtos {

    private MasterCatalogDtos() {
    }

    public record RangeDto(RangeGender appliesToGender, BigDecimal lowValue, BigDecimal highValue,
                           BigDecimal criticalLow, BigDecimal criticalHigh, String normalText) {
        static RangeDto from(MasterReferenceRange r) {
            return new RangeDto(r.getAppliesToGender(), r.getLowValue(), r.getHighValue(),
                    r.getCriticalLow(), r.getCriticalHigh(), r.getNormalText());
        }
    }

    public record ParameterDto(String code, String name, String unit, ParameterDataType dataType, int displayOrder,
                               Integer decimalPlaces, String groupHeading, List<RangeDto> referenceRanges) {
        static ParameterDto from(MasterTestParameter p) {
            return new ParameterDto(p.getCode(), p.getName(), p.getUnit(), p.getDataType(), p.getDisplayOrder(),
                    p.getDecimalPlaces(), p.getGroupHeading(), p.getReferenceRanges().stream().map(RangeDto::from).toList());
        }
    }

    public record ListItem(Long id, String code, String name, String departmentName, String category,
                           SpecimenType specimenType, BigDecimal suggestedPrice, Integer turnaroundHours,
                           int parameterCount, boolean active) {
        public static ListItem from(MasterLabTest t) {
            return new ListItem(t.getId(), t.getCode(), t.getName(), t.getDepartmentName(), t.getCategory(),
                    t.getSpecimenType(), t.getSuggestedPrice(), t.getTurnaroundHours(), t.getParameters().size(), t.isActive());
        }
    }

    public record Detail(Long id, String code, String name, String departmentName, String category,
                         SpecimenType specimenType, BigDecimal suggestedPrice, Integer turnaroundHours,
                         int displayOrder, boolean active, List<ParameterDto> parameters) {
        public static Detail from(MasterLabTest t) {
            return new Detail(t.getId(), t.getCode(), t.getName(), t.getDepartmentName(), t.getCategory(),
                    t.getSpecimenType(), t.getSuggestedPrice(), t.getTurnaroundHours(), t.getDisplayOrder(), t.isActive(),
                    t.getParameters().stream().map(ParameterDto::from).toList());
        }
    }

    public record RangeRequest(RangeGender appliesToGender, BigDecimal lowValue, BigDecimal highValue,
                               BigDecimal criticalLow, BigDecimal criticalHigh, String normalText) {
    }

    public record ParameterRequest(String code, @NotBlank String name, String unit,
                                   @NotNull ParameterDataType dataType, int displayOrder,
                                   Integer decimalPlaces, String groupHeading, List<RangeRequest> referenceRanges) {
    }

    public record UpsertRequest(@NotBlank String code, @NotBlank String name, @NotBlank String departmentName,
                                String category, @NotNull SpecimenType specimenType, BigDecimal suggestedPrice,
                                Integer turnaroundHours, int displayOrder, boolean active,
                                @Valid List<ParameterRequest> parameters) {
    }

    public record ImportRequest(@NotEmpty List<Long> masterTestIds) {
    }

    public record ImportResult(List<String> imported, List<String> skippedAlreadyExists) {
    }
}
