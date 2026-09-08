package np.com.lims.patient.entity;

public enum BloodGroup {
    A_POSITIVE("A+"),
    A_NEGATIVE("A-"),
    B_POSITIVE("B+"),
    B_NEGATIVE("B-"),
    AB_POSITIVE("AB+"),
    AB_NEGATIVE("AB-"),
    O_POSITIVE("O+"),
    O_NEGATIVE("O-"),
    UNKNOWN("Unknown");

    private final String label;

    BloodGroup(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }
}
