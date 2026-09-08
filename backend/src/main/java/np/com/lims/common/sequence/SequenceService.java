package np.com.lims.common.sequence;

import np.com.lims.common.exception.ApiException;
import np.com.lims.common.exception.ErrorCode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Hands out gap-free monotonic numbers per named sequence, using a row lock so concurrent
 * callers never receive the same value. Must run inside the caller's transaction so the number
 * is only consumed if the surrounding operation commits.
 */
@Service
public class SequenceService {

    private final SequenceRepository repository;

    public SequenceService(SequenceRepository repository) {
        this.repository = repository;
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public long next(String sequenceName) {
        AppSequence sequence = repository.findByName(sequenceName)
                .orElseThrow(() -> new ApiException(ErrorCode.INTERNAL_ERROR,
                        "Sequence not configured: " + sequenceName));
        long value = sequence.getNextValue();
        sequence.setNextValue(value + 1);
        return value;
    }

    /** Like {@link #next} but lazily creates the sequence row on first use (e.g. per-fiscal-year invoice numbers). */
    @Transactional(propagation = Propagation.MANDATORY)
    public long nextOrCreate(String sequenceName) {
        AppSequence sequence = repository.findByName(sequenceName)
                .orElseGet(() -> repository.save(AppSequence.start(sequenceName)));
        long value = sequence.getNextValue();
        sequence.setNextValue(value + 1);
        return value;
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public String nextOrCreateFormatted(String sequenceName, String pattern) {
        return pattern.formatted(nextOrCreate(sequenceName));
    }

    /** Formats as {@code <prefix><zero-padded number>}, e.g. {@code P0000042}. */
    @Transactional(propagation = Propagation.MANDATORY)
    public String nextFormatted(String sequenceName, String prefix, int width) {
        return prefix + String.format("%0" + width + "d", next(sequenceName));
    }
}
