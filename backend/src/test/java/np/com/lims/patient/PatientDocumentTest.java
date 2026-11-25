package np.com.lims.patient;

import np.com.lims.common.tenant.TenantContext;
import np.com.lims.patient.dto.PatientDocumentDtos.Summary;
import np.com.lims.patient.entity.Gender;
import np.com.lims.patient.entity.Patient;
import np.com.lims.patient.entity.PatientDocument;
import np.com.lims.patient.entity.PatientDocumentType;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class PatientDocumentTest {

    private Patient patient;

    @BeforeEach
    void setUp() {
        TenantContext.set(1L);
        patient = Patient.register("P000001", "Karan Bohara", Gender.MALE);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void createDocument_setsAllFieldsCorrectly() {
        byte[] fileData = "sample document content".getBytes();
        PatientDocument doc = PatientDocument.create(
                patient,
                "Chest X-Ray Report",
                PatientDocumentType.IMAGING,
                LocalDate.of(2026, 11, 20),
                "Teaching Hospital",
                "Normal lungs",
                "xray.png",
                "image/png",
                fileData.length,
                fileData,
                "admin"
        );

        assertThat(doc.getTitle()).isEqualTo("Chest X-Ray Report");
        assertThat(doc.getDocumentType()).isEqualTo(PatientDocumentType.IMAGING);
        assertThat(doc.getFileName()).isEqualTo("xray.png");
        assertThat(doc.getFileType()).isEqualTo("image/png");
        assertThat(doc.getFileSizeBytes()).isEqualTo(fileData.length);
        assertThat(doc.getFileData()).isEqualTo(fileData);
        assertThat(doc.getDoctorOrFacility()).isEqualTo("Teaching Hospital");
        assertThat(doc.getNotes()).isEqualTo("Normal lungs");
        assertThat(doc.getUploadedBy()).isEqualTo("admin");
        assertThat(doc.isDeleted()).isFalse();

        Summary summary = Summary.from(doc);
        assertThat(summary.title()).isEqualTo("Chest X-Ray Report");
        assertThat(summary.documentType()).isEqualTo("IMAGING");
        assertThat(summary.fileName()).isEqualTo("xray.png");
    }

    @Test
    void softDelete_marksDocumentAsDeleted() {
        PatientDocument doc = PatientDocument.create(
                patient,
                "Prescription",
                PatientDocumentType.PRESCRIPTION,
                LocalDate.now(),
                "Dr. Sharma",
                null,
                "rx.pdf",
                "application/pdf",
                100,
                new byte[100],
                "admin"
        );

        assertThat(doc.isDeleted()).isFalse();
        doc.softDelete("superadmin");

        assertThat(doc.isDeleted()).isTrue();
        assertThat(doc.getDeletedBy()).isEqualTo("superadmin");
        assertThat(doc.getDeletedAt()).isNotNull();
    }
}
