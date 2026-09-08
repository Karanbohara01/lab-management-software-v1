package np.com.lims.result;

import np.com.lims.catalog.entity.LabTest;
import np.com.lims.department.entity.Department;
import np.com.lims.catalog.entity.ParameterDataType;
import np.com.lims.catalog.entity.RangeGender;
import np.com.lims.catalog.entity.TestParameter;
import np.com.lims.patient.entity.Gender;
import np.com.lims.result.entity.ResultFlag;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class ReferenceRangeResolverTest {

    private final ReferenceRangeResolver resolver = new ReferenceRangeResolver();

    private TestParameter numericParam() {
        LabTest test = LabTest.create("T", "Test", Department.create("D", "Dept"));
        return test.addParameter("HGB", "Haemoglobin", "g/dL", ParameterDataType.NUMERIC, 1);
    }

    @Test
    void flagsValueWithinRangeAsNormal() {
        TestParameter p = numericParam();
        p.addRange(RangeGender.ALL, null, null, bd("13"), bd("17"), null, bd("7"), bd("20"));
        var result = resolver.interpret(p, Gender.MALE, 30, ParameterDataType.NUMERIC, bd("15"), null);
        assertThat(result.flag()).isEqualTo(ResultFlag.NORMAL);
        assertThat(result.referenceText()).isEqualTo("13 – 17");
    }

    @Test
    void flagsLowAndCriticalLow() {
        TestParameter p = numericParam();
        p.addRange(RangeGender.ALL, null, null, bd("13"), bd("17"), null, bd("7"), bd("20"));
        assertThat(resolver.interpret(p, Gender.MALE, 30, ParameterDataType.NUMERIC, bd("10"), null).flag())
                .isEqualTo(ResultFlag.LOW);
        assertThat(resolver.interpret(p, Gender.MALE, 30, ParameterDataType.NUMERIC, bd("5"), null).flag())
                .isEqualTo(ResultFlag.CRITICAL_LOW);
    }

    @Test
    void prefersGenderSpecificRange() {
        TestParameter p = numericParam();
        p.addRange(RangeGender.ALL, null, null, bd("12"), bd("16"), null, null, null);
        p.addRange(RangeGender.FEMALE, null, null, bd("12"), bd("15"), null, null, null);
        var result = resolver.interpret(p, Gender.FEMALE, 30, ParameterDataType.NUMERIC, bd("15.5"), null);
        assertThat(result.flag()).isEqualTo(ResultFlag.HIGH);
        assertThat(result.referenceText()).isEqualTo("12 – 15");
    }

    @Test
    void abnormalWhenTextDiffersFromExpected() {
        LabTest test = LabTest.create("U", "Urine", Department.create("C", "Clin"));
        TestParameter p = test.addParameter("ALB", "Albumin", null, ParameterDataType.CATEGORICAL, 1);
        p.addRange(RangeGender.ALL, null, null, null, null, "Nil", null, null);
        assertThat(resolver.interpret(p, Gender.MALE, 40, ParameterDataType.CATEGORICAL, null, "Nil").flag())
                .isEqualTo(ResultFlag.NORMAL);
        assertThat(resolver.interpret(p, Gender.MALE, 40, ParameterDataType.CATEGORICAL, null, "++").flag())
                .isEqualTo(ResultFlag.ABNORMAL);
    }

    private static BigDecimal bd(String v) {
        return new BigDecimal(v);
    }
}
