package np.com.lims.common.sequence;

import np.com.lims.common.exception.ApiException;
import np.com.lims.common.exception.ErrorCode;
import np.com.lims.common.tenant.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Hands out gap-free monotonic numbers per named sequence, using a row lock so concurrent
 * callers never receive the same value. Must run inside the caller's transaction so the number
 * is only consumed if the surrounding operation commits.
 *
 * <p>Every sequence is namespaced by the current organization (see {@link TenantContext}) — two
 * clinics both minting "PATIENT_MRN" numbers get two independent counters, each starting at 1,
 * rather than sharing one global counter (see migration V41 for how existing sequences were
 * renamed onto this scheme without renumbering any already-issued number). Calls made with no
 * tenant context (e.g. platform-level actions) fall back to the bare, unscoped name.
 */
@Service
public class SequenceService {

    private final SequenceRepository repository;

    public SequenceService(SequenceRepository repository) {
        this.repository = repository;
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public long next(String sequenceName) {
        String key = scoped(sequenceName);
        AppSequence sequence = repository.findByName(key)
                .orElseThrow(() -> new ApiException(ErrorCode.INTERNAL_ERROR, "Sequence not configured: " + key));
        long value = sequence.getNextValue();
        sequence.setNextValue(value + 1);
        return value;
    }

    /** Like {@link #next} but lazily creates the sequence row on first use (e.g. per-fiscal-year invoice numbers). */
    @Transactional(propagation = Propagation.MANDATORY)
    public long nextOrCreate(String sequenceName) {
        String key = scoped(sequenceName);
        AppSequence sequence = repository.findByName(key).orElseGet(() -> repository.save(AppSequence.start(key)));
        long value = sequence.getNextValue();
        sequence.setNextValue(value + 1);
        return value;
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public String nextOrCreateFormatted(String sequenceName, String pattern) {
        return pattern.formatted(nextOrCreate(sequenceName));
    }

    /**
     * Formats as {@code <prefix><zero-padded number>}, e.g. {@code P0000042}. Lazily creates the
     * sequence (like {@link #nextOrCreate}) rather than requiring it to already exist — a brand
     * new organization has no rows yet and should just start counting from 1 on first use, not
     * fail.
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public String nextFormatted(String sequenceName, String prefix, int width) {
        return prefix + String.format("%0" + width + "d", nextOrCreate(sequenceName));
    }

    /**
     * Unscoped variant: sequence name is NOT prepended with tenantId.
     * Used for platform-wide sequences like cross-tenant inquiry ticket numbers.
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public long nextOrCreateGlobal(String sequenceName) {
        AppSequence sequence = repository.findByName(sequenceName)
                .orElseGet(() -> repository.save(AppSequence.start(sequenceName)));
        long value = sequence.getNextValue();
        sequence.setNextValue(value + 1);
        return value;
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public String nextGlobalFormatted(String sequenceName, String prefix, int width) {
        return prefix + String.format("%0" + width + "d", nextOrCreateGlobal(sequenceName));
    }

    /**
     * Reserves {@code count} consecutive numbers in one go, formatted like {@link #nextFormatted}.
     *
     * <p>For callers that will create many records inside one transaction — the bulk patient
     * import. Taking the numbers one at a time would lock and re-read the sequence row per record,
     * and each such read makes Hibernate flush, which dirty-checks every entity already created in
     * the transaction: the cost of the batch grows with its square. One reservation per batch makes
     * it linear.
     *
     * <p>Gap-free only together with {@link #releaseUnused}: the bump and the records that use the
     * numbers commit or roll back together, so a batch that fails returns every number; a batch
     * that commits having used fewer than it reserved must hand the tail back before it does, or
     * those numbers are lost for good. The import consumes a number only once its patient has been
     * saved, and returns whatever is left at the end of the batch.
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public java.util.List<String> nextBlockFormatted(String sequenceName, String prefix, int width, int count) {
        if (count <= 0) {
            return java.util.List.of();
        }
        String key = scoped(sequenceName);
        AppSequence sequence = repository.findByName(key).orElseGet(() -> repository.save(AppSequence.start(key)));
        long first = sequence.getNextValue();
        sequence.setNextValue(first + count);
        java.util.List<String> numbers = new java.util.ArrayList<>(count);
        for (long value = first; value < first + count; value++) {
            numbers.add(prefix + String.format("%0" + width + "d", value));
        }
        return numbers;
    }

    /**
     * Hands back the unused tail of a block reserved by {@link #nextBlockFormatted}, inside the same
     * transaction. Safe because that transaction still holds the row lock the reservation took:
     * nothing else can have read a value past the one being rolled back to.
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public void releaseUnused(String sequenceName, int unused) {
        if (unused <= 0) {
            return;
        }
        String key = scoped(sequenceName);
        AppSequence sequence = repository.findByName(key)
                .orElseThrow(() -> new ApiException(ErrorCode.INTERNAL_ERROR, "Sequence not configured: " + key));
        sequence.setNextValue(sequence.getNextValue() - unused);
    }

    private static String scoped(String sequenceName) {
        Long tenantId = TenantContext.get();
        return tenantId == null ? sequenceName : tenantId + ":" + sequenceName;
    }
}
