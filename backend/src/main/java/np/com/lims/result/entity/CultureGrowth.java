package np.com.lims.result.entity;

/** Overall outcome of a microbiology culture. */
public enum CultureGrowth {
    NO_GROWTH("No growth after 48 hours of incubation"),
    NORMAL_FLORA("Normal commensal flora isolated"),
    MIXED_FLORA("Mixed flora — likely contamination, no significant pathogen"),
    GROWTH("Significant growth — see isolate(s) below");

    private final String description;

    CultureGrowth(String description) {
        this.description = description;
    }

    public String description() {
        return description;
    }

    /** True when the result carries a clinically significant pathogen. */
    public boolean isSignificant() {
        return this == GROWTH;
    }
}
