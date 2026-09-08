export type QcLevel = 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3' | 'LOW' | 'NORMAL' | 'HIGH';
export type QcStatus = 'IN_CONTROL' | 'WARNING' | 'REJECTED';
export type QcTargetSource = 'ASSIGNED' | 'ESTABLISHED';
export type QcControlState =
  | 'NOT_CONFIGURED'
  | 'NOT_ESTABLISHED'
  | 'IN_CONTROL'
  | 'WARNING'
  | 'OUT_OF_CONTROL';

export interface QcTarget {
  parameterId: number;
  parameterName: string;
  unit: string | null;
  targetMean: number;
  targetSd: number;
  source: QcTargetSource;
}

export interface QcMaterial {
  id: number;
  name: string;
  manufacturer: string | null;
  lotNumber: string | null;
  level: QcLevel;
  testId: number;
  testCode: string;
  testName: string;
  expiryDate: string | null;
  note: string | null;
  active: boolean;
  targets: QcTarget[];
}

export interface QcRun {
  id: number;
  materialId: number;
  materialName: string;
  level: QcLevel;
  parameterId: number;
  parameterName: string;
  value: number;
  targetMean: number;
  targetSd: number;
  zScore: number | null;
  status: QcStatus;
  violatedRules: string | null;
  analyzer: string | null;
  shift: string | null;
  operator: string | null;
  accepted: boolean;
  comment: string | null;
  runAt: string;
}

export interface LeveyJenningsPoint {
  runId: number;
  runAt: string;
  value: number;
  zScore: number | null;
  status: QcStatus;
  violatedRules: string | null;
}

export interface LeveyJennings {
  mean: number;
  sd: number;
  points: LeveyJenningsPoint[];
}

export interface QcControlStatus {
  state: QcControlState;
  messages: string[];
}
