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

    private static String scoped(String sequenceName) {
        Long tenantId = TenantContext.get();
        return tenantId == null ? sequenceName : tenantId + ":" + sequenceName;
    }
}
