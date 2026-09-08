package np.com.lims.common.formula;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class FormulaEvaluatorTest {

    private static BigDecimal bd(String s) {
        return new BigDecimal(s);
    }

    @Test
    void friedewaldLdl() {
        // LDL = TC - HDL - TG/5
        Map<String, BigDecimal> vars = Map.of("TC", bd("200"), "HDL", bd("50"), "TG", bd("150"));
        BigDecimal ldl = FormulaEvaluator.evaluate("TC - HDL - TG/5", vars);
        assertThat(ldl).isEqualByComparingTo("120");
    }

    @Test
    void ratioAndParens() {
        Map<String, BigDecimal> vars = Map.of("ALB", bd("4"), "GLOB", bd("2"));
        assertThat(FormulaEvaluator.evaluate("ALB / GLOB", vars)).isEqualByComparingTo("2");
        assertThat(FormulaEvaluator.evaluate("(ALB + GLOB) * 2", vars)).isEqualByComparingTo("12");
    }

    @Test
    void functionsAndConditionals() {
        Map<String, BigDecimal> vars = Map.of("x", bd("9"), "sexF", bd("1"));
        assertThat(FormulaEvaluator.evaluate("pow(x, 0.5)", vars)).isEqualByComparingTo("3");
        assertThat(FormulaEvaluator.evaluate("if(sexF == 1, 0.85, 1) * 100", vars)).isEqualByComparingTo("85");
    }

    @Test
    void unknownVariableOrBadExprYieldsNull() {
        assertThat(FormulaEvaluator.evaluate("A + B", Map.of("A", bd("1")))).isNull();
        assertThat(FormulaEvaluator.evaluate("1 / 0", Map.of())).isNull();
        assertThat(FormulaEvaluator.evaluate("2 +", Map.of())).isNull();
    }

    @Test
    void referencedNamesExcludesFunctions() {
        assertThat(FormulaEvaluator.referencedNames("TC - HDL - round(TG/5, 1)"))
                .containsExactly("TC", "HDL", "TG");
    }
}
