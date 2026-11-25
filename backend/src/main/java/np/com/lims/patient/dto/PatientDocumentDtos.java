package np.com.lims.patient.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import np.com.lims.patient.entity.PatientDocument;
import np.com.lims.patient.entity.PatientDocumentType;

import java.time.Instant;
import java.time.LocalDate;

public final class PatientDocumentDtos {

    private PatientDocumentDtos() {
    }

    public record Summary(
            Long id,
            Long patientId,
            String title,
            String documentType,
            LocalDate documentDate,
            String doctorOrFacility,
            String notes,
            String fileName,
            String fileType,
            long fileSizeBytes,
            String uploadedBy,
            Instant uploadedAt
    ) {
        public static Summary from(PatientDocument d) {
            return new Summary(
                    d.getId(),
                    d.getPatient().getId(),
                    d.getTitle(),
                    d.getDocumentType().name(),
                    d.getDocumentDate(),
                    d.getDoctorOrFacility(),
                    d.getNotes(),
                    d.getFileName(),
                    d.getFileType(),
                    d.getFileSizeBytes(),
                    d.getUploadedBy(),
                    d.getUploadedAt()
            );
        }
    }

    public record UploadRequest(
            @NotBlank(message = "Document title is required") String title,
            @NotNull(message = "Document type is required") PatientDocumentType documentType,
            LocalDate documentDate,
            String doctorOrFacility,
            String notes
    ) {
    }
}
