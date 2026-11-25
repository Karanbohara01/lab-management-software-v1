package np.com.lims.order;

import np.com.lims.common.tenant.TenantContext;
import np.com.lims.order.dto.OrderDtos;
import np.com.lims.order.entity.LabOrder;
import np.com.lims.patient.entity.Gender;
import np.com.lims.patient.entity.Patient;
import np.com.lims.patient.entity.PatientDocument;
import np.com.lims.patient.entity.PatientDocumentType;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class LabOrderPrescriptionTest {

    private Patient patient;
    private PatientDocument prescription;

    @BeforeEach
    void setUp() {
        TenantContext.set(1L);
        patient = Patient.register("P000001", "Ms Namita Giri", Gender.FEMALE);
        prescription = PatientDocument.create(
                patient,
                "Dr. Sharma Prescription",
                PatientDocumentType.PRESCRIPTION,
                LocalDate.of(2026, 11, 20),
                "Patan Hospital",
                "Patient referred for lipid panel and CBC",
                "prescription.jpg",
                "image/jpeg",
                1024,
                new byte[]{1, 2, 3},
                "staff"
        );
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void labOrder_canAttachPrescriptionDocument() {
        LabOrder order = LabOrder.open("ORD000001", patient, null, "Routine checkup");
        order.setPrescriptionDocument(prescription);

        assertThat(order.getPrescriptionDocument()).isNotNull();
        assertThat(order.getPrescriptionDocument().getTitle()).isEqualTo("Dr. Sharma Prescription");
        assertThat(order.getPrescriptionDocument().getDocumentType()).isEqualTo(PatientDocumentType.PRESCRIPTION);

        OrderDtos.Detail detail = OrderDtos.Detail.from(order);
        assertThat(detail.prescription()).isNotNull();
        assertThat(detail.prescription().title()).isEqualTo("Dr. Sharma Prescription");
        assertThat(detail.prescription().fileName()).isEqualTo("prescription.jpg");
        assertThat(detail.prescription().doctorOrFacility()).isEqualTo("Patan Hospital");

        OrderDtos.ListItem item = OrderDtos.ListItem.from(order);
        assertThat(item.hasPrescription()).isTrue();
    }

    @Test
    void labOrder_withoutPrescription_hasNullPrescriptionSummary() {
        LabOrder order = LabOrder.open("ORD000002", patient, null, null);

        assertThat(order.getPrescriptionDocument()).isNull();
        OrderDtos.Detail detail = OrderDtos.Detail.from(order);
        assertThat(detail.prescription()).isNull();

        OrderDtos.ListItem item = OrderDtos.ListItem.from(order);
        assertThat(item.hasPrescription()).isFalse();
    }
}
