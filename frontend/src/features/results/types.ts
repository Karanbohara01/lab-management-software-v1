import type { OrderPriority } from '@/features/orders/types';
import type { ParameterDataType } from '@/features/catalog/types';

export type ResultStatus = 'PENDING' | 'ENTERED' | 'VERIFIED' | 'APPROVED';
export type ResultFlag =
  | 'NONE'
  | 'NORMAL'
  | 'LOW'
  | 'HIGH'
  | 'CRITICAL_LOW'
  | 'CRITICAL_HIGH'
  | 'ABNORMAL';

export interface ResultValue {
  id: number;
  parameterId: number;
  parameterName: string;
  unit: string | null;
  dataType: ParameterDataType;
  displayOrder: number;
  valueNumeric: number | null;
  valueText: string | null;
  flag: ResultFlag;
  referenceText: string | null;
  previousValue: number | null;
  deltaPercent: number | null;
  deltaBreach: boolean;
  comment: string | null;
  calculated: boolean;
  decimalPlaces: number | null;
  allowedValues: string[];
  method: string | null;
  groupHeading: string | null;
}

export interface ResultHistoryEntry {
  id: number;
  parameterName: string;
  oldValue: string | null;
  newValue: string | null;
  reason: string | null;
  changedBy: string;
  changedAt: string;
}

export interface ResultListItem {
  id: number;
  orderId: number;
  orderNumber: string;
  sampleId: number;
  accessionNumber: string;
  patientId: number;
  patientName: string;
  patientMrn: string;
  testCode: string;
  testName: string;
  departmentName: string;
  status: ResultStatus;
  priority: OrderPriority;
  dueAt: string | null;
  overdue: boolean;
  autoVerified: boolean;
  criticalAckRequired: boolean;
  hasAbnormal: boolean;
  hasCritical: boolean;
  createdAt: string;
}

export interface ResultDetail {
  id: number;
  orderId: number;
  orderNumber: string;
  sampleId: number;
  accessionNumber: string;
  patientId: number;
  patientName: string;
  patientMrn: string;
  patientGender: string;
  patientAgeYears: number | null;
  testId: number;
  testCode: string;
  testName: string;
  departmentName: string;
  status: ResultStatus;
  priority: OrderPriority;
  dueAt: string | null;
  overdue: boolean;
  autoVerified: boolean;
  criticalAckRequired: boolean;
  criticalCallbacks: CriticalCallback[];
  sampleCondition: string | null;
  comment: string | null;
  hasAbnormal: boolean;
  hasCritical: boolean;
  rejectionReason: string | null;
  enteredAt: string | null;
  enteredBy: string | null;
  verifiedAt: string | null;
  verifiedBy: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
  amendedAt: string | null;
  amendedBy: string | null;
  values: ResultValue[];
  history: ResultHistoryEntry[];
}

export type ContactMethod = 'PHONE' | 'IN_PERSON' | 'SMS' | 'EMAIL' | 'OTHER';

export interface CriticalCallback {
  id: number;
  notifiedName: string | null;
  notifiedRole: string | null;
  contactMethod: ContactMethod;
  readBackConfirmed: boolean;
  remarks: string | null;
  waived: boolean;
  waivedReason: string | null;
  notifiedAt: string;
  loggedBy: string | null;
}

export interface CommentTemplate {
  id: number;
  scope: 'GLOBAL' | 'DEPARTMENT' | 'TEST';
  category: string | null;
  title: string;
  body: string;
}

export interface ValueInput {
  parameterId: number;
  valueNumeric?: number | null;
  valueText?: string | null;
  comment?: string | null;
}

export const RESULT_STATUS_LABEL: Record<ResultStatus, string> = {
  PENDING: 'Pending entry',
  ENTERED: 'Awaiting verification',
  VERIFIED: 'Awaiting approval',
  APPROVED: 'Approved',
};

export const RESULT_STATUS_TONE: Record<ResultStatus, 'neutral' | 'warning' | 'info' | 'success'> = {
  PENDING: 'neutral',
  ENTERED: 'warning',
  VERIFIED: 'info',
  APPROVED: 'success',
};

export function flagLabel(flag: ResultFlag): string {
  switch (flag) {
    case 'LOW':
      return 'Low';
    case 'HIGH':
      return 'High';
    case 'CRITICAL_LOW':
      return 'Critical low';
    case 'CRITICAL_HIGH':
      return 'Critical high';
    case 'ABNORMAL':
      return 'Abnormal';
    case 'NORMAL':
      return 'Normal';
    default:
      return '';
  }
}

export function flagTone(flag: ResultFlag): 'neutral' | 'success' | 'warning' | 'critical' {
  if (flag === 'CRITICAL_LOW' || flag === 'CRITICAL_HIGH') return 'critical';
  if (flag === 'LOW' || flag === 'HIGH' || flag === 'ABNORMAL') return 'warning';
  if (flag === 'NORMAL') return 'success';
  return 'neutral';
}
