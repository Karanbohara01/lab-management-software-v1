package np.com.lims.result;

import np.com.lims.catalog.entity.AgeUnit;
import np.com.lims.catalog.entity.ParameterDataType;
import np.com.lims.catalog.entity.RangeGender;
import np.com.lims.catalog.entity.ReferenceRange;
import np.com.lims.catalog.entity.TestParameter;
import np.com.lims.patient.entity.Gender;
import np.com.lims.result.entity.ResultFlag;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.Optional;

/**
 * Picks the most specific reference range that is in effect for a patient and interprets a value
 * against it. Gender-specific beats ALL; a narrower age band beats a wider one; a more recent
 * effective date beats an older one. Ranges dated in the future, or flagged pregnancy-only, are
 * excluded from automatic matching.
 */
@Component
public class ReferenceRangeResolver {

    public record Interpretation(
            ResultFlag flag,
            String referenceText,
            BigDecimal lowValue,
            BigDecimal highValue,
            BigDecimal criticalLow,
            BigDecimal criticalHigh
    ) {
        static final Interpretation NONE = new Interpretation(ResultFlag.NONE, null, null, null, null, null);
    }

    /** Back-compat overload — approximates age in days from whole years. */
    public Interpretation interpret(TestParameter parameter, Gender gender, Integer ageYears,
                                    ParameterDataType dataType, BigDecimal numericValue, String textValue) {
        return interpret(parameter, gender, ageYears, ageYears == null ? null : ageYears * 365,
                dataType, numericValue, textValue);
    }

    public Interpretation interpret(TestParameter parameter, Gender gender, Integer ageYears, Integer ageDays,
                                    ParameterDataType dataType, BigDecimal numericValue, String textValue) {
        LocalDate today = LocalDate.now();
        Optional<ReferenceRange> match = parameter.getReferenceRanges().stream()
                .filter(r -> !r.isAppliesToPregnant())
                .filter(r -> r.getEffectiveFrom() == null || !r.getEffectiveFrom().isAfter(today))
                .filter(r -> genderMatches(r.getAppliesToGender(), gender))
                .filter(r -> ageMatches(r, ageYears, ageDays))
                .min(specificity());

        if (match.isEmpty()) {
            return Interpretation.NONE;
        }
        ReferenceRange range = match.get();

        if (dataType == ParameterDataType.NUMERIC) {
            return new Interpretation(
                    numericFlag(range, numericValue),
                    numericReferenceText(range),
                    range.getLowValue(),
                    range.getHighValue(),
                    range.getCriticalLow(),
                    range.getCriticalHigh()
            );
        }
        return new Interpretation(textFlag(range, textValue), range.getNormalText(), null, null, null, null);
    }

    private static boolean genderMatches(RangeGender rangeGender, Gender patientGender) {
        if (rangeGender == RangeGender.ALL) {
            return true;
        }
        return patientGender != null && rangeGender.name().equals(patientGender.name());
    }

    private static boolean ageMatches(ReferenceRange range, Integer ageYears, Integer ageDays) {
        if (range.getAgeLow() == null && range.getAgeHigh() == null) {
            return true;
        }
        Integer age = ageInUnit(range.getAgeUnit(), ageYears, ageDays);
        if (age == null) {
            return false; // an age-banded range, but we don't know the patient's age precisely enough
        }
        return (range.getAgeLow() == null || age >= range.getAgeLow())
                && (range.getAgeHigh() == null || age <= range.getAgeHigh());
    }

    private static Integer ageInUnit(AgeUnit unit, Integer ageYears, Integer ageDays) {
        return switch (unit) {
            case YEARS -> ageYears != null ? ageYears : (ageDays != null ? ageDays / 365 : null);
            case MONTHS -> ageDays != null ? ageDays / 30 : (ageYears != null ? ageYears * 12 : null);
            case DAYS -> ageDays;
        };
    }

    private static Comparator<ReferenceRange> specificity() {
        // lower score = more specific = preferred by min()
        Comparator<ReferenceRange> byGender = Comparator.comparingInt(
                r -> r.getAppliesToGender() == RangeGender.ALL ? 1 : 0);
        Comparator<ReferenceRange> byAgeBand = Comparator.comparingLong(ReferenceRangeResolver::ageSpan);
        Comparator<ReferenceRange> byRecency = Comparator.comparing(
                (ReferenceRange r) -> r.getEffectiveFrom() == null ? LocalDate.MIN : r.getEffectiveFrom()).reversed();
        return byGender.thenComparing(byAgeBand).thenComparing(byRecency);
    }

    private static long ageSpan(ReferenceRange r) {
        if (r.getAgeLow() == null && r.getAgeHigh() == null) {
            return Long.MAX_VALUE;
        }
        int low = r.getAgeLow() == null ? 0 : r.getAgeLow();
        int high = r.getAgeHigh() == null ? 100000 : r.getAgeHigh();
        return (long) high - low;
    }

    private static ResultFlag numericFlag(ReferenceRange range, BigDecimal value) {
        if (value == null) {
            return ResultFlag.NONE;
        }
        if (isMeaningfulCriticalLow(range) && value.compareTo(range.getCriticalLow()) < 0) {
            return ResultFlag.CRITICAL_LOW;
        }
        if (isMeaningfulCriticalHigh(range) && value.compareTo(range.getCriticalHigh()) > 0) {
            return ResultFlag.CRITICAL_HIGH;
        }
        if (range.getLowValue() != null && value.compareTo(range.getLowValue()) < 0) {
            return ResultFlag.LOW;
        }
        if (range.getHighValue() != null && value.compareTo(range.getHighValue()) > 0) {
            return ResultFlag.HIGH;
        }
        return ResultFlag.NORMAL;
    }

    private static boolean isMeaningfulCriticalLow(ReferenceRange range) {
        BigDecimal cLow = range.getCriticalLow();
        if (cLow == null) {
            return false;
        }
        // Critical low of 0 when normal range is positive is an unset/garbage zero
        if (cLow.compareTo(BigDecimal.ZERO) <= 0 && range.getLowValue() != null && range.getLowValue().compareTo(BigDecimal.ZERO) > 0) {
            return false;
        }
        // Medically, a panic low alert must be strictly lower than the normal lower limit
        if (range.getLowValue() != null && cLow.compareTo(range.getLowValue()) >= 0) {
            return false;
        }
        return true;
    }

    private static boolean isMeaningfulCriticalHigh(ReferenceRange range) {
        BigDecimal cHigh = range.getCriticalHigh();
        if (cHigh == null) {
            return false;
        }
        // Critical high of <= 0 when normal range is positive (e.g. 0 when normal is 36-50) is an unset/garbage zero
        if (cHigh.compareTo(BigDecimal.ZERO) <= 0 && range.getHighValue() != null && range.getHighValue().compareTo(BigDecimal.ZERO) > 0) {
            return false;
        }
        // Medically, a panic high alert must be strictly higher than the normal upper limit
        if (range.getHighValue() != null && cHigh.compareTo(range.getHighValue()) <= 0) {
            return false;
        }
        return true;
    }

    private static ResultFlag textFlag(ReferenceRange range, String value) {
        if (range.getNormalText() == null || range.getNormalText().isBlank() || value == null || value.isBlank()) {
            return ResultFlag.NONE;
        }
        return range.getNormalText().trim().equalsIgnoreCase(value.trim()) ? ResultFlag.NORMAL : ResultFlag.ABNORMAL;
    }

    private static String numericReferenceText(ReferenceRange range) {
        String low = plain(range.getLowValue());
        String high = plain(range.getHighValue());
        if (low != null && high != null) {
            return low + " – " + high;
        }
        if (low != null) {
            return "≥ " + low;
        }
        if (high != null) {
            return "≤ " + high;
        }
        return range.getNormalText();
    }

    private static String plain(BigDecimal value) {
        return value == null ? null : value.stripTrailingZeros().toPlainString();
    }
}
