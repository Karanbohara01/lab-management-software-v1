import type { SpecimenType } from '@/features/catalog/types';

export type SampleStatus = 'AWAITING_COLLECTION' | 'COLLECTED' | 'RECEIVED' | 'REJECTED';

export type SampleEventType =
  | 'CREATED'
  | 'COLLECTED'
  | 'RECEIVED'
  | 'REJECTED'
  | 'RECOLLECTION_REQUESTED'
  | 'NOTE';

export interface SampleItem {
  id: number;
  orderItemId: number;
  testId: number;
  testCode: string;
  testName: string;
  departmentId: number;
  departmentName: string;
}

export interface SampleEvent {
  id: number;
  eventType: SampleEventType;
  fromStatus: SampleStatus | null;
  toStatus: SampleStatus | null;
  actor: string;
  note: string | null;
  occurredAt: string;
}

export interface SampleListItem {
  id: number;
  accessionNumber: string;
  orderId: number;
  orderNumber: string;
  patientId: number;
  patientName: string;
  patientMrn: string;
  specimenType: SpecimenType;
  status: SampleStatus;
  testCount: number;
  departments: string[];
  conditionSummary: string | null;
  createdAt: string;
}

export interface SampleDetail {
  id: number;
  accessionNumber: string;
  barcodeValue: string;
  orderId: number;
  orderNumber: string;
  patientId: number;
  patientName: string;
  patientMrn: string;
  specimenType: SpecimenType;
  status: SampleStatus;
  container: string | null;
  collectionSite: string | null;
  rejectionReason: string | null;
  collectedAt: string | null;
  collectedBy: string | null;
  receivedAt: string | null;
  receivedBy: string | null;
  rejectedAt: string | null;
  rejectedBy: string | null;
  condition: SpecimenConditionInput | null;
  conditionSummary: string | null;
  items: SampleItem[];
  events: SampleEvent[];
}

export interface SpecimenConditionInput {
  haemolysed: boolean;
  lipaemic: boolean;
  icteric: boolean;
  clotted: boolean;
  insufficientVolume: boolean;
  wrongContainer: boolean;
  note: string | null;
}

export const SPECIMEN_CONDITION_FLAGS: { key: keyof SpecimenConditionInput; label: string }[] = [
  { key: 'haemolysed', label: 'Haemolysed' },
  { key: 'lipaemic', label: 'Lipaemic' },
  { key: 'icteric', label: 'Icteric' },
  { key: 'clotted', label: 'Clotted' },
  { key: 'insufficientVolume', label: 'Insufficient volume' },
  { key: 'wrongContainer', label: 'Wrong container' },
];

export const SAMPLE_STATUS_LABEL: Record<SampleStatus, string> = {
  AWAITING_COLLECTION: 'Awaiting collection',
  COLLECTED: 'Collected',
  RECEIVED: 'Received',
  REJECTED: 'Rejected',
};

export const SAMPLE_STATUS_TONE: Record<SampleStatus, 'neutral' | 'info' | 'warning' | 'success' | 'danger'> = {
  AWAITING_COLLECTION: 'warning',
  COLLECTED: 'info',
  RECEIVED: 'success',
  REJECTED: 'danger',
};
