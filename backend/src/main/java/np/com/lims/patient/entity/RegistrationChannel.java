package np.com.lims.patient.entity;

/** How a patient record came to exist. Stored by name, so adding a value needs no migration. */
public enum RegistrationChannel {
    WALK_IN, PHONE, ONLINE, PARTNER, CAMP, HOME_COLLECTION,
    /** Migrated in bulk from the clinic's previous software rather than registered at the desk. */
    IMPORT
}
