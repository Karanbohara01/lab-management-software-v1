package np.com.lims.patient.entity;

/** How the patient reaches the laboratory. Drives pricing, routing and reporting downstream. */
public enum PatientCategory {
    WALK_IN, OPD_REFERRAL, IPD, HEALTH_CAMP, CORPORATE, INSURANCE, MEDICO_LEGAL, STAFF, RESEARCH
}
