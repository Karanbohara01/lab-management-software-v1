package np.com.lims.appointment.entity;

import java.util.Set;

public enum AppointmentStatus {
    SCHEDULED,
    CHECKED_IN,
    CONVERTED,
    CANCELLED,
    NO_SHOW;

    private static final Set<AppointmentStatus> FROM_SCHEDULED = Set.of(CHECKED_IN, CONVERTED, CANCELLED, NO_SHOW);
    private static final Set<AppointmentStatus> FROM_CHECKED_IN = Set.of(CONVERTED, CANCELLED);

    public boolean canTransitionTo(AppointmentStatus target) {
        return switch (this) {
            case SCHEDULED -> FROM_SCHEDULED.contains(target);
            case CHECKED_IN -> FROM_CHECKED_IN.contains(target);
            case CONVERTED, CANCELLED, NO_SHOW -> false;
        };
    }

    /** Only a still-SCHEDULED appointment can be rescheduled (time/reason/doctor edited). */
    public boolean isEditable() {
        return this == SCHEDULED;
    }
}
