package np.com.lims.patientimport.entity;

/**
 * What the administrator chose to do with rows that match an existing patient. Decided once, at
 * confirmation, after seeing how many there are and which patients they match.
 *
 * <p>There is deliberately no "merge" option. Merging patient records is a separate, reviewed act
 * with its own screen; an import never does it in bulk.
 */
public enum DuplicatePolicy {

    /** Leave the existing patient untouched and import nothing for that row. The safe default. */
    SKIP,

    /**
     * Create a second patient anyway. For a clinic whose old system genuinely held two people under
     * one phone number. Each one is registered with an explicit override reason naming this import,
     * so the audit trail says why the usual duplicate guard was passed.
     */
    IMPORT_AS_NEW,

    /**
     * Fill in fields the existing patient does not have. Only ever writes where the current value is
     * blank — an import can complete a record but never overwrite what the clinic already holds, and
     * every change is audited field by field.
     */
    FILL_BLANKS
}
