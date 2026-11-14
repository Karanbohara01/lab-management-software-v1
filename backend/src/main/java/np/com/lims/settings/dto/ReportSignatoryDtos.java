package np.com.lims.settings.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import np.com.lims.settings.entity.ReportSignatory;

public final class ReportSignatoryDtos {

    private ReportSignatoryDtos() {
    }

    public record UpsertRequest(
            @NotBlank @Size(max = 80) String title,
            @Size(max = 2_000_000) String signatureDataUri,
            int displayOrder
    ) {
    }

    public record Response(Long id, String title, String signatureDataUri, int displayOrder) {
        public static Response from(ReportSignatory s) {
            return new Response(s.getId(), s.getTitle(), s.getSignatureDataUri(), s.getDisplayOrder());
        }
    }
}
