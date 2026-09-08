import type { ResultFlag } from '@/features/results/types';

export type ReportStatus = 'GENERATED' | 'RELEASED' | 'DELIVERED';

export interface LabHeader {
  name: string;
  addressLine: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  panNumber: string | null;
  reportFooter: string | null;
  logoDataUri: string | null;
}

export interface ReportParameterLine {
  name: string;
  unit: string | null;
  value: string | null;
  flag: ResultFlag;
  referenceText: string | null;
  comment: string | null;
}

export interface ReportTestBlock {
  testCode: string;
  testName: string;
  departmentName: string;
  method: string | null;
  specimen: string | null;
  accessionNumber: string | null;
  comment: string | null;
  verifiedBy: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  parameters: ReportParameterLine[];
}

export interface ReportListItem {
  id: number;
  reportNumber: string;
  orderId: number;
  orderNumber: string;
  patientId: number;
  patientName: string;
  patientMrn: string;
  status: ReportStatus;
  reportType: 'PRELIMINARY' | 'FINAL';
  reportVersion: number;
  testCount: number;
  hasCritical: boolean;
  generatedAt: string;
}

export interface ReportDetail {
  id: number;
  reportNumber: string;
  orderId: number;
  orderNumber: string;
  patientId: number;
  patientName: string;
  patientMrn: string;
  patientGender: string;
  patientAgeYears: number | null;
  referringDoctorName: string | null;
  status: ReportStatus;
  reportType: 'PRELIMINARY' | 'FINAL';
  verificationToken: string | null;
  contentHash: string | null;
  signedBy: string | null;
  signerCredentials: string | null;
  signedAt: string | null;
  reportVersion: number;
  hasCritical: boolean;
  generatedAt: string;
  generatedBy: string;
  releasedAt: string | null;
  releasedBy: string | null;
  deliveredAt: string | null;
  deliveredBy: string | null;
  deliveryMethod: string | null;
  deliveryRecipient: string | null;
  laboratory: LabHeader;
  tests: ReportTestBlock[];
}

export const REPORT_STATUS_TONE: Record<ReportStatus, 'neutral' | 'info' | 'success'> = {
  GENERATED: 'neutral',
  RELEASED: 'info',
  DELIVERED: 'success',
};
