package np.com.lims.sample.entity;

import np.com.lims.catalog.entity.SpecimenType;
import np.com.lims.common.model.Priority;
import np.com.lims.order.entity.LabOrder;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class SamplePriorityTest {

    @Test
    void aSampleSnapshotsTheOrdersPriorityAtCreation() {
        LabOrder order = LabOrder.open("ORD000001", null, null, null, null);
        order.applyPriority(Priority.STAT);

        Sample sample = Sample.create("S000001", order, SpecimenType.BLOOD_EDTA, "tech1");

        assertThat(sample.getPriority()).isEqualTo(Priority.STAT);
    }

    @Test
    void aSampleDefaultsToTheOrdersRoutinePriority() {
        LabOrder order = LabOrder.open("ORD000002", null, null, null, null);

        Sample sample = Sample.create("S000002", order, SpecimenType.BLOOD_EDTA, "tech1");

        assertThat(sample.getPriority()).isEqualTo(Priority.ROUTINE);
    }

    @Test
    void changingTheOrdersPriorityLaterDoesNotRetroactivelyChangeAnAlreadyCreatedSample() {
        LabOrder order = LabOrder.open("ORD000003", null, null, null, null);
        order.applyPriority(Priority.URGENT);
        Sample sample = Sample.create("S000003", order, SpecimenType.BLOOD_EDTA, "tech1");

        order.applyPriority(Priority.STAT);

        assertThat(sample.getPriority()).isEqualTo(Priority.URGENT);
    }
}
