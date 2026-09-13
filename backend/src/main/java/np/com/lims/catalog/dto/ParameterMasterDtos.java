package np.com.lims.catalog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import np.com.lims.catalog.entity.ParameterDataType;
import np.com.lims.catalog.entity.ParameterMaster;

import java.math.BigDecimal;

public final class ParameterMasterDtos {

    private ParameterMasterDtos() {
    }

    public record Response(Long id, String name, String code, String unit, ParameterDataType dataType,
                           Integer decimalPlaces, String method, String loincCode, String groupHeading,
                           String allowedValues, BigDecimal lowValue, BigDecimal highValue,
                           BigDecimal criticalLow, BigDecimal criticalHigh, boolean active) {
        public static Response from(ParameterMaster p) {
            return new Response(p.getId(), p.getName(), p.getCode(), p.getUnit(), p.getDataType(),
                    p.getDecimalPlaces(), p.getMethod(), p.getLoincCode(), p.getGroupHeading(), p.getAllowedValues(),
                    p.getLowValue(), p.getHighValue(), p.getCriticalLow(), p.getCriticalHigh(), p.isActive());
        }
    }

    public record UpsertRequest(
            @NotBlank @Size(max = 160) String name,
            @Size(max = 32) String code,
            @Size(max = 32) String unit,
            @NotNull ParameterDataType dataType,
            Integer decimalPlaces,
            @Size(max = 120) String method,
            @Size(max = 20) String loincCode,
            @Size(max = 120) String groupHeading,
            @Size(max = 500) String allowedValues,
            BigDecimal lowValue,
            BigDecimal highValue,
            BigDecimal criticalLow,
            BigDecimal criticalHigh
    ) {
    }
}
