package np.com.lims.catalog.entity;

/**
 * How results for a test are entered.
 * PARAMETRIC = one value per {@link TestParameter} (chemistry, haematology, serology).
 * CULTURE    = a microbiology culture: an overall growth outcome plus, when organisms
 *              are isolated, an antibiotic susceptibility panel per isolate.
 */
public enum ResultMode {
    PARAMETRIC,
    CULTURE
}
