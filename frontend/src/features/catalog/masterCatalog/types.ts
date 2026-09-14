import type { ParameterDataType, RangeGender, SpecimenType } from '../types';

export interface MasterRange {
  appliesToGender: RangeGender;
  lowValue: number | null;
  highValue: number | null;
  criticalLow: number | null;
  criticalHigh: number | null;
  normalText: string | null;
}

export interface MasterParameter {
  code: string | null;
  name: string;
  unit: string | null;
  dataType: ParameterDataType;
  displayOrder: number;
  decimalPlaces: number | null;
  groupHeading: string | null;
  referenceRanges: MasterRange[];
}

export interface MasterTestListItem {
  id: number;
  code: string;
  name: string;
  departmentName: string;
  category: string | null;
  specimenType: SpecimenType;
  suggestedPrice: number;
  turnaroundHours: number | null;
  parameterCount: number;
  active: boolean;
}

export interface MasterTestDetail {
  id: number;
  code: string;
  name: string;
  departmentName: string;
  category: string | null;
  specimenType: SpecimenType;
  suggestedPrice: number;
  turnaroundHours: number | null;
  displayOrder: number;
  active: boolean;
  parameters: MasterParameter[];
}

export interface MasterTestUpsertPayload {
  code: string;
  name: string;
  departmentName: string;
  category?: string;
  specimenType: SpecimenType;
  suggestedPrice: number;
  turnaroundHours?: number;
  displayOrder: number;
  active: boolean;
  parameters: MasterParameter[];
}

export interface ImportResult {
  imported: string[];
  skippedAlreadyExists: string[];
}
