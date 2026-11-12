package np.com.lims.appointment.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import np.com.lims.catalog.entity.LabTest;
import np.com.lims.common.audit.BaseEntity;

/**
 * A test the booked visit is expected to need. Holds only the catalog reference and a quantity —
 * never a price. Pricing is always computed live from the catalog (the same stateless preview the
 * order builder uses) and only becomes durable once the appointment converts into a LabOrder,
 * which is the first and only place this system ever snapshots money.
 */
@Entity
@Table(name = "appointment_test")
public class AppointmentTest extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "appointment_id", nullable = false)
    private Appointment appointment;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "lab_test_id", nullable = false)
    private LabTest test;

    @Column(nullable = false)
    private int quantity = 1;

    protected AppointmentTest() {
    }

    AppointmentTest(Appointment appointment, LabTest test, int quantity) {
        this.appointment = appointment;
        this.test = test;
        this.quantity = Math.max(1, quantity);
    }

    public LabTest getTest() {
        return test;
    }

    public int getQuantity() {
        return quantity;
    }
}
