export type SpecimenType =
  | 'BLOOD_EDTA'
  | 'BLOOD_SERUM'
  | 'BLOOD_CITRATE'
  | 'BLOOD_FLUORIDE'
  | 'BLOOD_HEPARIN'
  | 'WHOLE_BLOOD'
  | 'URINE'
  | 'STOOL'
  | 'SPUTUM'
  | 'SWAB'
  | 'CSF'
  | 'BODY_FLUID'
  | 'TISSUE'
  | 'OTHER';

export type ParameterDataType =
  | 'NUMERIC'
  | 'TEXT'
  | 'CATEGORICAL'
  | 'POSITIVE_NEGATIVE'
  | 'REACTIVE_NONREACTIVE';

export type RangeGender = 'ALL' | 'MALE' | 'FEMALE';
export type AgeUnit = 'YEARS' | 'MONTHS' | 'DAYS';
export type TestType = 'ANALYTE' | 'PROFILE';

export interface ReferenceRange {
  appliesToGender: RangeGender;
  ageLow: number | null;
  ageHigh: number | null;
  ageUnit: AgeUnit;
  appliesToPregnant: boolean;
  effectiveFrom: string | null;
  source: string | null;
  lowValue: number | null;
  highValue: number | null;
  normalText: string | null;
  criticalLow: number | null;
  criticalHigh: number | null;
}

export interface TestParameter {
  id?: number;
  code: string | null;
  name: string;
  unit: string | null;
  dataType: ParameterDataType;
  displayOrder: number;
  decimalPlaces: number | null;
  calculationFormula: string | null;
  allowedValues: string | null;
  absurdLow: number | null;
  absurdHigh: number | null;
  method: string | null;
  loincCode: string | null;
  groupHeading: string | null;
  deltaCheckPercent: number | null;
  calculated: boolean;
  referenceRanges: ReferenceRange[];
}

export interface SpecimenHandling {
  containerType: string | null;
  minVolumeMl: number | null;
  stabilityNote: string | null;
  fastingRequired: boolean;
  fastingHours: number | null;
  referral: boolean;
  referralLab: string | null;
}

export interface MemberTest {
  id: number;
  code: string;
  name: string;
  departmentName: string;
  price: number;
}

export interface TestListItem {
  id: number;
  code: string;
  name: string;
  type: TestType;
  departmentId: number;
  departmentName: string;
  category: string | null;
  specimenType: SpecimenType;
  price: number;
  turnaroundHours: number | null;
  referral: boolean;
  parameterCount: number;
  memberCount: number;
  active: boolean;
}

export interface TestDetail {
  id: number;
  code: string;
  name: string;
  type: TestType;
  departmentId: number;
  departmentName: string;
  category: string | null;
  specimenType: SpecimenType;
  specimenRequirements: string | null;
  method: string | null;
  loincCode: string | null;
  price: number;
  turnaroundHours: number | null;
  specimenHandling: SpecimenHandling;
  autoVerifyEnabled: boolean;
  active: boolean;
  parameters: TestParameter[];
  members: MemberTest[];
}

export interface RangePayload {
  appliesToGender: RangeGender;
  ageLow: number | null;
  ageHigh: number | null;
  ageUnit: AgeUnit;
  appliesToPregnant: boolean;
  effectiveFrom: string | null;
  source: string | null;
  lowValue: number | null;
  highValue: number | null;
  normalText: string | null;
  criticalLow: number | null;
  criticalHigh: number | null;
}

export interface TestUpsertPayload {
  code?: string;
  name: string;
  type: TestType;
  departmentId: number;
  category?: string;
  specimenType: SpecimenType;
  specimenRequirements?: string;
  method?: string;
  loincCode?: string;
  price: string;
  turnaroundHours?: number | null;
  specimenHandling: SpecimenHandling;
  autoVerifyEnabled: boolean;
  parameters: Array<{
    code?: string;
    name: string;
    unit?: string;
    dataType: ParameterDataType;
    displayOrder: number;
    decimalPlaces?: number | null;
    calculationFormula?: string;
    allowedValues?: string;
    absurdLow?: number | null;
    absurdHigh?: number | null;
    method?: string;
    groupHeading?: string;
    deltaCheckPercent?: number | null;
    referenceRanges: RangePayload[];
  }>;
  memberTestIds: number[];
}

export const SPECIMEN_LABELS: Record<SpecimenType, string> = {
  BLOOD_EDTA: 'Blood — EDTA (lavender)',
  BLOOD_SERUM: 'Blood — Serum (gel/red)',
  BLOOD_CITRATE: 'Blood — Citrate (blue)',
  BLOOD_FLUORIDE: 'Blood — Fluoride (grey)',
  BLOOD_HEPARIN: 'Blood — Heparin (green)',
  WHOLE_BLOOD: 'Whole blood',
  URINE: 'Urine',
  STOOL: 'Stool',
  SPUTUM: 'Sputum',
  SWAB: 'Swab',
  CSF: 'CSF',
  BODY_FLUID: 'Body fluid',
  TISSUE: 'Tissue',
  OTHER: 'Other',
};

export const DATA_TYPE_LABELS: Record<ParameterDataType, string> = {
  NUMERIC: 'Numeric',
  TEXT: 'Free text',
  CATEGORICAL: 'Categorical',
  POSITIVE_NEGATIVE: 'Positive / Negative',
  REACTIVE_NONREACTIVE: 'Reactive / Non-reactive',
};

export const AGE_UNIT_LABELS: Record<AgeUnit, string> = {
  YEARS: 'years',
  MONTHS: 'months',
  DAYS: 'days',
};
