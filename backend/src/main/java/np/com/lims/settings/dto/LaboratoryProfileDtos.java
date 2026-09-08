package np.com.lims.settings.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import np.com.lims.settings.entity.LaboratoryProfile;

public final class LaboratoryProfileDtos {

    private LaboratoryProfileDtos() {
    }

    public record UpdateRequest(
            @NotBlank @Size(max = 200) String name,
            @Size(max = 300) String addressLine,
            @Size(max = 120) String city,
            @Size(max = 64) String phone,
            @Email @Size(max = 160) String email,
            @Size(max = 40) String panNumber,
            @Size(max = 1000) String reportFooter,
            @Size(max = 2_000_000) String logoDataUri,
            @jakarta.validation.constraints.NotBlank @Size(max = 16) String fiscalYear,
            @jakarta.validation.constraints.NotBlank @Size(max = 16) String invoicePrefix,
            @jakarta.validation.constraints.PositiveOrZero java.math.BigDecimal defaultTaxRate,
            @jakarta.validation.constraints.Min(1) Integer inventoryExpiryAlertDays
    ) {
    }

    public record Response(
            String name,
            String addressLine,
            String city,
            String phone,
            String email,
            String panNumber,
            String reportFooter,
            String logoDataUri,
            String fiscalYear,
            String invoicePrefix,
            java.math.BigDecimal defaultTaxRate,
            int inventoryExpiryAlertDays
    ) {
        public static Response from(LaboratoryProfile p) {
            return new Response(p.getName(), p.getAddressLine(), p.getCity(), p.getPhone(), p.getEmail(),
                    p.getPanNumber(), p.getReportFooter(), p.getLogoDataUri(),
                    p.getFiscalYear(), p.getInvoicePrefix(), p.getDefaultTaxRate(), p.getInventoryExpiryAlertDays());
        }
    }
}
