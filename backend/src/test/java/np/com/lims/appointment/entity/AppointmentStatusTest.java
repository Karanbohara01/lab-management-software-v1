package np.com.lims.appointment.entity;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class AppointmentStatusTest {

    @Test
    void scheduledCanMoveToCheckedInConvertedCancelledOrNoShow() {
        assertThat(AppointmentStatus.SCHEDULED.canTransitionTo(AppointmentStatus.CHECKED_IN)).isTrue();
        assertThat(AppointmentStatus.SCHEDULED.canTransitionTo(AppointmentStatus.CONVERTED)).isTrue();
        assertThat(AppointmentStatus.SCHEDULED.canTransitionTo(AppointmentStatus.CANCELLED)).isTrue();
        assertThat(AppointmentStatus.SCHEDULED.canTransitionTo(AppointmentStatus.NO_SHOW)).isTrue();
    }

    @Test
    void checkedInCanOnlyMoveToConvertedOrCancelled() {
        assertThat(AppointmentStatus.CHECKED_IN.canTransitionTo(AppointmentStatus.CONVERTED)).isTrue();
        assertThat(AppointmentStatus.CHECKED_IN.canTransitionTo(AppointmentStatus.CANCELLED)).isTrue();
        assertThat(AppointmentStatus.CHECKED_IN.canTransitionTo(AppointmentStatus.SCHEDULED)).isFalse();
        assertThat(AppointmentStatus.CHECKED_IN.canTransitionTo(AppointmentStatus.NO_SHOW)).isFalse();
    }

    @Test
    void terminalStatusesCannotTransitionAnywhere() {
        for (AppointmentStatus target : AppointmentStatus.values()) {
            assertThat(AppointmentStatus.CONVERTED.canTransitionTo(target)).isFalse();
            assertThat(AppointmentStatus.CANCELLED.canTransitionTo(target)).isFalse();
            assertThat(AppointmentStatus.NO_SHOW.canTransitionTo(target)).isFalse();
        }
    }

    @Test
    void onlyScheduledIsEditable() {
        assertThat(AppointmentStatus.SCHEDULED.isEditable()).isTrue();
        assertThat(AppointmentStatus.CHECKED_IN.isEditable()).isFalse();
        assertThat(AppointmentStatus.CONVERTED.isEditable()).isFalse();
        assertThat(AppointmentStatus.CANCELLED.isEditable()).isFalse();
        assertThat(AppointmentStatus.NO_SHOW.isEditable()).isFalse();
    }
}
