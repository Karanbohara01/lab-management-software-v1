package np.com.lims.result.entity;

import np.com.lims.catalog.entity.LabTest;
import np.com.lims.catalog.entity.ParameterDataType;
import np.com.lims.catalog.entity.TestParameter;
import np.com.lims.department.entity.Department;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class TestResultCompletenessTest {

    private final LabTest cbc = LabTest.create("CBC", "Complete blood count", Department.create("H", "Haematology"));

    private TestParameter numeric(String code, String name, int order) {
        return cbc.addParameter(code, name, "g/dL", ParameterDataType.NUMERIC, order);
    }

    private static void fill(ResultValue value, String numeric) {
        value.setValue(new BigDecimal(numeric), null, ResultFlag.NORMAL, "13 – 17");
    }

    @Test
    void aFreshResultIsMissingEveryEnterableParameter() {
        TestResult result = new TestResult();
        result.addParameterSlot(numeric("HGB", "Haemoglobin", 1));
        result.addParameterSlot(numeric("HCT", "Haematocrit", 2));

        assertThat(result.isComplete()).isFalse();
        assertThat(result.missingValues()).extracting(ResultValue::getParameterName)
                .containsExactly("Haemoglobin", "Haematocrit");
    }

    @Test
    void aPartiallyEnteredResultListsOnlyTheBlanksInDisplayOrder() {
        TestResult result = new TestResult();
        ResultValue hgb = result.addParameterSlot(numeric("HGB", "Haemoglobin", 1));
        result.addParameterSlot(numeric("HCT", "Haematocrit", 2));
        result.addParameterSlot(numeric("RBC", "Red cell count", 3));
        fill(hgb, "15");

        assertThat(result.isComplete()).isFalse();
        assertThat(result.missingValues()).extracting(ResultValue::getParameterName)
                .containsExactly("Haematocrit", "Red cell count");
    }

    @Test
    void aFullyEnteredResultIsComplete() {
        TestResult result = new TestResult();
        fill(result.addParameterSlot(numeric("HGB", "Haemoglobin", 1)), "15");
        fill(result.addParameterSlot(numeric("HCT", "Haematocrit", 2)), "45");

        assertThat(result.isComplete()).isTrue();
        assertThat(result.missingValues()).isEmpty();
    }

    @Test
    void aCalculatedParameterWithAComputedValueIsNotMissing() {
        TestParameter mchc = numeric("MCHC", "MCHC", 3);
        mchc.configure(null, "HGB / HCT * 100", null, null, null, null, null, null, null);

        TestResult result = new TestResult();
        fill(result.addParameterSlot(numeric("HGB", "Haemoglobin", 1)), "15");
        fill(result.addParameterSlot(numeric("HCT", "Haematocrit", 2)), "45");
        ResultValue mchcValue = result.addParameterSlot(mchc);
        fill(mchcValue, "33.3"); // what TestResultService.computeDerived would have written

        assertThat(result.isComplete()).isTrue();
        assertThat(result.missingValues()).isEmpty();
    }

    @Test
    void aCalculatedParameterThatFailedToComputeCountsAsMissingEvenWithFullInputs() {
        // A formula can leave its slot blank for reasons that have nothing to do with a missing
        // input — division by zero, a malformed expression, a code that doesn't match any sibling
        // parameter (see FormulaEvaluator's own javadoc). When that happens, every manually-entered
        // parameter can be genuinely complete while the derived one still has no value — the only
        // thing that can say so is the calculated slot itself.
        TestParameter mchc = numeric("MCHC", "MCHC", 3);
        mchc.configure(null, "HGB / HCT * 100", null, null, null, null, null, null, null);

        TestResult result = new TestResult();
        fill(result.addParameterSlot(numeric("HGB", "Haemoglobin", 1)), "15");
        fill(result.addParameterSlot(numeric("HCT", "Haematocrit", 2)), "45");
        result.addParameterSlot(mchc); // left blank, as FormulaEvaluator.evaluate would on failure

        assertThat(result.isComplete()).isFalse();
        assertThat(result.missingValues()).extracting(ResultValue::getParameterName).containsExactly("MCHC");
    }

    @Test
    void blankTextAndWhitespaceCountAsMissing() {
        TestResult result = new TestResult();
        ResultValue colour = result.addParameterSlot(cbc.addParameter("COL", "Colour", null, ParameterDataType.TEXT, 1));
        colour.setValue(null, "   ", ResultFlag.NONE, null);

        assertThat(result.missingValues()).extracting(ResultValue::getParameterName).containsExactly("Colour");
    }
}
