package np.com.lims.result.entity;

/** Antibiotic susceptibility interpretation (CLSI). */
public enum Susceptibility {
    S("Susceptible"),
    I("Intermediate"),
    R("Resistant"),
    SDD("Susceptible-dose dependent"),
    NT("Not tested");

    private final String label;

    Susceptibility(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }
}
