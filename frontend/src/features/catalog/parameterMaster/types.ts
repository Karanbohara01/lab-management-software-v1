export type ParameterDataType = 'NUMERIC' | 'TEXT' | 'CATEGORICAL' | 'POSITIVE_NEGATIVE' | 'REACTIVE_NONREACTIVE';

export interface ParameterMaster {
  id: number;
  name: string;
  code: string | null;
  unit: string | null;
  dataType: ParameterDataType;
  decimalPlaces: number | null;
  method: string | null;
  loincCode: string | null;
  groupHeading: string | null;
  allowedValues: string | null;
  lowValue: number | null;
  highValue: number | null;
  criticalLow: number | null;
  criticalHigh: number | null;
  active: boolean;
}

export interface ParameterMasterUpsert {
  name: string;
  code?: string;
  unit?: string;
  dataType: ParameterDataType;
  decimalPlaces?: number | null;
  method?: string;
  loincCode?: string;
  groupHeading?: string;
  allowedValues?: string;
  lowValue?: number | null;
  highValue?: number | null;
  criticalLow?: number | null;
  criticalHigh?: number | null;
}

export const PARAMETER_DATA_TYPE_LABEL: Record<ParameterDataType, string> = {
  NUMERIC: 'Numeric',
  TEXT: 'Text',
  CATEGORICAL: 'Categorical (picklist)',
  POSITIVE_NEGATIVE: 'Positive / Negative',
  REACTIVE_NONREACTIVE: 'Reactive / Non-reactive',
};
