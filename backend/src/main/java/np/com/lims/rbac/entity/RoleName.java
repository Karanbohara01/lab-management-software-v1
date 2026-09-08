package np.com.lims.rbac.entity;

/** System roles. Mapped to Spring Security authorities as {@code ROLE_<name>}. */
public enum RoleName {
    SUPER_ADMIN,
    LAB_ADMINISTRATOR,
    RECEPTIONIST,
    LAB_TECHNICIAN,
    PATHOLOGIST,
    ACCOUNTANT,
    DOCTOR,
    SAMPLE_COLLECTION_STAFF;

    public String authority() {
        return "ROLE_" + name();
    }
}
