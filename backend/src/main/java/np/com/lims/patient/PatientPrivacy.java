package np.com.lims.patient;

import np.com.lims.common.web.CurrentUser;
import np.com.lims.patient.entity.Patient;

/**
 * Cross-module guard for the {@code confidential} patient flag. Modules that surface a
 * patient's name (orders, samples, results, reports, billing, e-billing) call this so a
 * user without {@code PERM_PATIENT_CONFIDENTIAL} never sees the name of a restricted
 * patient, even indirectly. The MRN is kept — it is an opaque key, not identifying on its own.
 */
public final class PatientPrivacy {

    private PatientPrivacy() {
    }

    public static String displayName(Patient patient) {
        if (patient == null) {
            return null;
        }
        if (patient.isConfidential() && !CurrentUser.hasAuthority("PERM_PATIENT_CONFIDENTIAL")) {
            return "Confidential patient";
        }
        return patient.getFullName();
    }
}
