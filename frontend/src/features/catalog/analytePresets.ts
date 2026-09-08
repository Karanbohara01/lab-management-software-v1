/**
 * Editable convenience presets for the test-catalog parameter editor.
 * Picking a known analyte pre-fills empty fields; every value stays editable.
 * Reference intervals are typical adult values and are NOT a substitute for the
 * lab's own method-specific validation.
 */

export const UNIT_OPTIONS: string[] = [
  '%',
  'g/dL',
  'g/L',
  'mg/dL',
  'mg/L',
  'µg/dL',
  'µg/L',
  'ng/mL',
  'ng/dL',
  'pg/mL',
  'mmol/L',
  'µmol/L',
  'mEq/L',
  'U/L',
  'IU/L',
  'mIU/L',
  'µIU/mL',
  'IU/mL',
  'x10³/µL',
  'x10⁶/µL',
  'fL',
  'pg',
  'mm/hr',
  '/hpf',
  '/lpf',
  'cells/µL',
  'ratio',
  'seconds',
  'mL/min/1.73m²',
  'copies/mL',
  'titre',
];

export interface AnalytePreset {
  name: string;
  code: string;
  unit: string;
  decimalPlaces?: number;
  low?: number;
  high?: number;
  criticalLow?: number;
  criticalHigh?: number;
  group?: string;
}

export const ANALYTE_PRESETS: AnalytePreset[] = [
  // Haematology
  { name: 'Haemoglobin', code: 'HGB', unit: 'g/dL', decimalPlaces: 1, low: 12, high: 17, criticalLow: 7, criticalHigh: 20 },
  { name: 'Haematocrit', code: 'HCT', unit: '%', decimalPlaces: 1, low: 36, high: 50 },
  { name: 'RBC Count', code: 'RBC', unit: 'x10⁶/µL', decimalPlaces: 2, low: 4.5, high: 5.9 },
  { name: 'WBC Count', code: 'WBC', unit: 'x10³/µL', decimalPlaces: 1, low: 4, high: 11, criticalLow: 1, criticalHigh: 30 },
  { name: 'Platelet Count', code: 'PLT', unit: 'x10³/µL', low: 150, high: 450, criticalLow: 20, criticalHigh: 1000 },
  { name: 'MCV', code: 'MCV', unit: 'fL', decimalPlaces: 1, low: 80, high: 100 },
  { name: 'MCH', code: 'MCH', unit: 'pg', decimalPlaces: 1, low: 27, high: 33 },
  { name: 'MCHC', code: 'MCHC', unit: 'g/dL', decimalPlaces: 1, low: 32, high: 36 },
  { name: 'RDW', code: 'RDW', unit: '%', decimalPlaces: 1, low: 11.5, high: 14.5 },
  { name: 'Neutrophils', code: 'NEUT', unit: '%', decimalPlaces: 1, low: 40, high: 75, group: 'Differential count' },
  { name: 'Lymphocytes', code: 'LYMPH', unit: '%', decimalPlaces: 1, low: 20, high: 45, group: 'Differential count' },
  { name: 'Monocytes', code: 'MONO', unit: '%', decimalPlaces: 1, low: 2, high: 10, group: 'Differential count' },
  { name: 'Eosinophils', code: 'EO', unit: '%', decimalPlaces: 1, low: 1, high: 6, group: 'Differential count' },
  { name: 'Basophils', code: 'BASO', unit: '%', decimalPlaces: 1, low: 0, high: 1, group: 'Differential count' },
  { name: 'ESR', code: 'ESR', unit: 'mm/hr', low: 0, high: 20 },
  // Diabetes
  { name: 'Glucose Fasting', code: 'GLU-F', unit: 'mg/dL', low: 70, high: 100, criticalLow: 40, criticalHigh: 450 },
  { name: 'Glucose Random', code: 'GLU-R', unit: 'mg/dL', low: 70, high: 140, criticalLow: 40, criticalHigh: 450 },
  { name: 'Glucose PP (2h)', code: 'GLU-PP', unit: 'mg/dL', low: 70, high: 140 },
  { name: 'HbA1c', code: 'HBA1C', unit: '%', decimalPlaces: 1, low: 4, high: 5.6 },
  // Renal
  { name: 'Blood Urea', code: 'UREA', unit: 'mg/dL', low: 15, high: 40 },
  { name: 'Creatinine', code: 'CREA', unit: 'mg/dL', decimalPlaces: 2, low: 0.6, high: 1.3, criticalHigh: 6 },
  { name: 'Uric Acid', code: 'UA', unit: 'mg/dL', decimalPlaces: 1, low: 3.5, high: 7.2 },
  { name: 'eGFR', code: 'EGFR', unit: 'mL/min/1.73m²', low: 90, high: 120 },
  // Electrolytes
  { name: 'Sodium', code: 'NA', unit: 'mmol/L', low: 135, high: 145, criticalLow: 120, criticalHigh: 160 },
  { name: 'Potassium', code: 'K', unit: 'mmol/L', decimalPlaces: 1, low: 3.5, high: 5.1, criticalLow: 2.5, criticalHigh: 6.5 },
  { name: 'Chloride', code: 'CL', unit: 'mmol/L', low: 98, high: 107 },
  { name: 'Bicarbonate', code: 'HCO3', unit: 'mmol/L', low: 22, high: 29 },
  { name: 'Calcium', code: 'CA', unit: 'mg/dL', decimalPlaces: 1, low: 8.6, high: 10.2, criticalLow: 6, criticalHigh: 13 },
  { name: 'Phosphorus', code: 'PHOS', unit: 'mg/dL', decimalPlaces: 1, low: 2.5, high: 4.5 },
  { name: 'Magnesium', code: 'MG', unit: 'mg/dL', decimalPlaces: 1, low: 1.7, high: 2.2 },
  // Liver
  { name: 'Total Bilirubin', code: 'TBIL', unit: 'mg/dL', decimalPlaces: 1, low: 0.2, high: 1.2 },
  { name: 'Direct Bilirubin', code: 'DBIL', unit: 'mg/dL', decimalPlaces: 2, low: 0, high: 0.3 },
  { name: 'SGPT (ALT)', code: 'ALT', unit: 'U/L', low: 0, high: 41 },
  { name: 'SGOT (AST)', code: 'AST', unit: 'U/L', low: 0, high: 40 },
  { name: 'Alkaline Phosphatase', code: 'ALP', unit: 'U/L', low: 40, high: 129 },
  { name: 'GGT', code: 'GGT', unit: 'U/L', low: 8, high: 61 },
  { name: 'Total Protein', code: 'TP', unit: 'g/dL', decimalPlaces: 1, low: 6.4, high: 8.3 },
  { name: 'Albumin', code: 'ALB', unit: 'g/dL', decimalPlaces: 1, low: 3.5, high: 5.2 },
  // Lipid
  { name: 'Total Cholesterol', code: 'TC', unit: 'mg/dL', high: 200 },
  { name: 'HDL Cholesterol', code: 'HDL', unit: 'mg/dL', low: 40, high: 60 },
  { name: 'LDL Cholesterol', code: 'LDL', unit: 'mg/dL', high: 100 },
  { name: 'Triglycerides', code: 'TG', unit: 'mg/dL', high: 150 },
  { name: 'VLDL Cholesterol', code: 'VLDL', unit: 'mg/dL', high: 30 },
  // Thyroid / vitamins / markers
  { name: 'TSH', code: 'TSH', unit: 'µIU/mL', decimalPlaces: 2, low: 0.4, high: 4 },
  { name: 'Free T4', code: 'FT4', unit: 'ng/dL', decimalPlaces: 2, low: 0.8, high: 1.8 },
  { name: 'Free T3', code: 'FT3', unit: 'pg/mL', decimalPlaces: 1, low: 2.3, high: 4.2 },
  { name: 'Vitamin D (25-OH)', code: 'VITD', unit: 'ng/mL', low: 30, high: 100 },
  { name: 'Vitamin B12', code: 'B12', unit: 'pg/mL', low: 200, high: 900 },
  { name: 'Ferritin', code: 'FERR', unit: 'ng/mL', low: 30, high: 300 },
  { name: 'CRP', code: 'CRP', unit: 'mg/L', high: 5 },
  { name: 'PSA Total', code: 'PSA', unit: 'ng/mL', decimalPlaces: 2, high: 4 },
];

const BY_NAME = new Map(ANALYTE_PRESETS.map((p) => [p.name.toLowerCase(), p]));

export function findAnalytePreset(value: string): AnalytePreset | undefined {
  return BY_NAME.get(value.trim().toLowerCase());
}
