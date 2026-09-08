package np.com.lims.qc;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Applies the common Westgard multirule set to a new QC point given the recent
 * series (most-recent-first) of z-scores for the same material + parameter.
 */
@Component
public class WestgardEvaluator {

    public record Evaluation(QcStatus status, List<String> rules) {}

    /** @param history z-scores of prior runs, newest first (this point excluded). */
    public Evaluation evaluate(double z, List<Double> history) {
        List<String> rejects = new ArrayList<>();
        List<String> warnings = new ArrayList<>();

        double az = Math.abs(z);
        if (az > 3) {
            rejects.add("1-3s");
        } else if (az > 2) {
            warnings.add("1-2s");
        }

        Double prev = history.isEmpty() ? null : history.get(0);
        if (prev != null) {
            if (Math.abs(prev) >= 2 && az >= 2 && sameSign(z, prev)) {
                rejects.add("2-2s");
            }
            if ((z >= 2 && prev <= -2) || (z <= -2 && prev >= 2)) {
                rejects.add("R-4s");
            }
        }

        if (allSameSideAtLeast(z, history, 4, 1.0)) {
            rejects.add("4-1s");
        }
        if (allSameSideAtLeast(z, history, 10, 0.0)) {
            rejects.add("10x");
        }

        if (!rejects.isEmpty()) {
            return new Evaluation(QcStatus.REJECTED, rejects);
        }
        if (!warnings.isEmpty()) {
            return new Evaluation(QcStatus.WARNING, warnings);
        }
        return new Evaluation(QcStatus.IN_CONTROL, List.of());
    }

    private static boolean sameSign(double a, double b) {
        return (a >= 0) == (b >= 0);
    }

    /** The new point plus the last {@code n-1} history points are all on one side of the mean, each |z| >= threshold. */
    private static boolean allSameSideAtLeast(double z, List<Double> history, int n, double threshold) {
        if (history.size() < n - 1) {
            return false;
        }
        boolean positive = z >= 0;
        if (Math.abs(z) < threshold) {
            return false;
        }
        for (int i = 0; i < n - 1; i++) {
            double h = history.get(i);
            if ((h >= 0) != positive || Math.abs(h) < threshold) {
                return false;
            }
        }
        return true;
    }
}
