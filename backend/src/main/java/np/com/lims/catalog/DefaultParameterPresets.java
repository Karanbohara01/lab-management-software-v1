package np.com.lims.catalog;

import java.math.BigDecimal;
import java.util.List;

/**
 * The same starter analyte set migration V48 seeded for every organization that existed at the
 * time — kept here too (a second representation of the same defaults, same tradeoff this
 * codebase already accepts for RBAC permissions defined in both a migration and an enum) so a
 * NEW organization provisioned after that migration also starts with a real dictionary instead
 * of an empty one. Unit + typical adult reference range only — not a substitute for the lab's own
 * method-specific validation, same caveat the original frontend-hardcoded list carried.
 */
final class DefaultParameterPresets {

    private DefaultParameterPresets() {
    }

    record Preset(String name, String code, String unit, Integer decimalPlaces, BigDecimal low, BigDecimal high,
                  BigDecimal criticalLow, BigDecimal criticalHigh, String groupHeading) {
        private static Preset of(String name, String code, String unit, Integer dp, Double low, Double high,
                                 Double cLow, Double cHigh, String group) {
            return new Preset(name, code, unit, dp,
                    low == null ? null : BigDecimal.valueOf(low), high == null ? null : BigDecimal.valueOf(high),
                    cLow == null ? null : BigDecimal.valueOf(cLow), cHigh == null ? null : BigDecimal.valueOf(cHigh), group);
        }
    }

    // Group headings below match the printed-report sub-section convention (see
    // np.com.lims.report — ReportParameter.groupHeading): consecutive parameters sharing the same
    // group render under one bold sub-heading within their test's table. Only applied to
    // multi-component panels (CBC/LFT/RFT) where the sub-grouping mirrors how these are actually
    // laid out on a real printed lab report; short 2-5 line panels (lipid, thyroid, single
    // analytes) are left ungrouped — sub-headings would add noise, not clarity, at that size.
    static final List<Preset> ALL = List.of(
            Preset.of("Haemoglobin", "HGB", "g/dL", 1, 12.0, 17.0, 7.0, 20.0, "Erythrocytes"),
            Preset.of("Haematocrit", "HCT", "%", 1, 36.0, 50.0, null, null, "Erythrocytes"),
            Preset.of("RBC Count", "RBC", "x10⁶/µL", 2, 4.5, 5.9, null, null, "Erythrocytes"),
            Preset.of("WBC Count", "WBC", "x10³/µL", 1, 4.0, 11.0, 1.0, 30.0, "Leucocytes"),
            Preset.of("Platelet Count", "PLT", "x10³/µL", null, 150.0, 450.0, 20.0, 1000.0, "Platelets"),
            Preset.of("MCV", "MCV", "fL", 1, 80.0, 100.0, null, null, "RBC Indices"),
            Preset.of("MCH", "MCH", "pg", 1, 27.0, 33.0, null, null, "RBC Indices"),
            Preset.of("MCHC", "MCHC", "g/dL", 1, 32.0, 36.0, null, null, "RBC Indices"),
            Preset.of("RDW", "RDW", "%", 1, 11.5, 14.5, null, null, "RBC Indices"),
            Preset.of("Neutrophils", "NEUT", "%", 1, 40.0, 75.0, null, null, "Differential Leukocyte Count"),
            Preset.of("Lymphocytes", "LYMPH", "%", 1, 20.0, 45.0, null, null, "Differential Leukocyte Count"),
            Preset.of("Monocytes", "MONO", "%", 1, 2.0, 10.0, null, null, "Differential Leukocyte Count"),
            Preset.of("Eosinophils", "EO", "%", 1, 1.0, 6.0, null, null, "Differential Leukocyte Count"),
            Preset.of("Basophils", "BASO", "%", 1, 0.0, 1.0, null, null, "Differential Leukocyte Count"),
            Preset.of("ESR", "ESR", "mm/hr", null, 0.0, 20.0, null, null, null),
            Preset.of("Glucose Fasting", "GLU-F", "mg/dL", null, 70.0, 100.0, 40.0, 450.0, null),
            Preset.of("Glucose Random", "GLU-R", "mg/dL", null, 70.0, 140.0, 40.0, 450.0, null),
            Preset.of("Glucose PP (2h)", "GLU-PP", "mg/dL", null, 70.0, 140.0, null, null, null),
            Preset.of("HbA1c", "HBA1C", "%", 1, 4.0, 5.6, null, null, null),
            Preset.of("Blood Urea", "UREA", "mg/dL", null, 15.0, 40.0, null, null, "Renal Function"),
            Preset.of("Creatinine", "CREA", "mg/dL", 2, 0.6, 1.3, null, 6.0, "Renal Function"),
            Preset.of("Uric Acid", "UA", "mg/dL", 1, 3.5, 7.2, null, null, "Renal Function"),
            Preset.of("eGFR", "EGFR", "mL/min/1.73m²", null, 90.0, 120.0, null, null, "Renal Function"),
            Preset.of("Sodium", "NA", "mmol/L", null, 135.0, 145.0, 120.0, 160.0, "Electrolytes"),
            Preset.of("Potassium", "K", "mmol/L", 1, 3.5, 5.1, 2.5, 6.5, "Electrolytes"),
            Preset.of("Chloride", "CL", "mmol/L", null, 98.0, 107.0, null, null, "Electrolytes"),
            Preset.of("Bicarbonate", "HCO3", "mmol/L", null, 22.0, 29.0, null, null, "Electrolytes"),
            Preset.of("Calcium", "CA", "mg/dL", 1, 8.6, 10.2, 6.0, 13.0, "Minerals"),
            Preset.of("Phosphorus", "PHOS", "mg/dL", 1, 2.5, 4.5, null, null, "Minerals"),
            Preset.of("Magnesium", "MG", "mg/dL", 1, 1.7, 2.2, null, null, "Minerals"),
            Preset.of("Total Bilirubin", "TBIL", "mg/dL", 1, 0.2, 1.2, null, null, "Bilirubin"),
            Preset.of("Direct Bilirubin", "DBIL", "mg/dL", 2, 0.0, 0.3, null, null, "Bilirubin"),
            Preset.of("SGPT (ALT)", "ALT", "U/L", null, 0.0, 41.0, null, null, "Liver Enzymes"),
            Preset.of("SGOT (AST)", "AST", "U/L", null, 0.0, 40.0, null, null, "Liver Enzymes"),
            Preset.of("Alkaline Phosphatase", "ALP", "U/L", null, 40.0, 129.0, null, null, "Liver Enzymes"),
            Preset.of("GGT", "GGT", "U/L", null, 8.0, 61.0, null, null, "Liver Enzymes"),
            Preset.of("Total Protein", "TP", "g/dL", 1, 6.4, 8.3, null, null, "Proteins"),
            Preset.of("Albumin", "ALB", "g/dL", 1, 3.5, 5.2, null, null, "Proteins"),
            Preset.of("Total Cholesterol", "TC", "mg/dL", null, null, 200.0, null, null, null),
            Preset.of("HDL Cholesterol", "HDL", "mg/dL", null, 40.0, 60.0, null, null, null),
            Preset.of("LDL Cholesterol", "LDL", "mg/dL", null, null, 100.0, null, null, null),
            Preset.of("Triglycerides", "TG", "mg/dL", null, null, 150.0, null, null, null),
            Preset.of("VLDL Cholesterol", "VLDL", "mg/dL", null, null, 30.0, null, null, null),
            Preset.of("TSH", "TSH", "µIU/mL", 2, 0.4, 4.0, null, null, null),
            Preset.of("Free T4", "FT4", "ng/dL", 2, 0.8, 1.8, null, null, null),
            Preset.of("Free T3", "FT3", "pg/mL", 1, 2.3, 4.2, null, null, null),
            Preset.of("Vitamin D (25-OH)", "VITD", "ng/mL", null, 30.0, 100.0, null, null, null),
            Preset.of("Vitamin B12", "B12", "pg/mL", null, 200.0, 900.0, null, null, null),
            Preset.of("Ferritin", "FERR", "ng/mL", null, 30.0, 300.0, null, null, null),
            Preset.of("CRP", "CRP", "mg/L", null, null, 5.0, null, null, null),
            Preset.of("PSA Total", "PSA", "ng/mL", 2, null, 4.0, null, null, null)
    );
}
