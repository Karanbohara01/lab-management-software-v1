package np.com.lims.appointment.entity;

import np.com.lims.common.exception.ApiException;
import np.com.lims.common.exception.ErrorCode;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AppointmentItemsTest {

    private static Appointment scheduled() {
        return Appointment.open("APT000001", null, null, null, Instant.now(), null);
    }

    @Test
    void itemsCanBeAddedAndClearedWhileScheduled() {
        Appointment appointment = scheduled();

        appointment.addItem(null, 2);
        appointment.addItem(null, 0);

        assertThat(appointment.getItems()).hasSize(2);
        assertThat(appointment.getItems().get(0).getQuantity()).isEqualTo(2);
        assertThat(appointment.getItems().get(1).getQuantity()).as("quantity floors at 1").isEqualTo(1);

        appointment.clearItems();
        assertThat(appointment.getItems()).isEmpty();
    }

    @Test
    void itemsAreFrozenOnceCheckedIn() {
        Appointment appointment = scheduled();
        appointment.addItem(null, 1);
        appointment.checkIn();

        assertThatThrownBy(() -> appointment.addItem(null, 1))
                .isInstanceOf(ApiException.class)
                .satisfies(e -> assertThat(((ApiException) e).errorCode()).isEqualTo(ErrorCode.INVALID_STATE_TRANSITION));
        assertThatThrownBy(appointment::clearItems)
                .isInstanceOf(ApiException.class);
        assertThat(appointment.getItems()).as("failed mutation leaves items untouched").hasSize(1);
    }

    @Test
    void itemsAreFrozenOnceCancelled() {
        Appointment appointment = scheduled();
        appointment.cancel("patient called");

        assertThatThrownBy(() -> appointment.addItem(null, 1)).isInstanceOf(ApiException.class);
    }
}
