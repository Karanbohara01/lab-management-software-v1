import type { ResultFlag } from '@/features/results/types';

export type ReportStatus = 'GENERATED' | 'RELEASED' | 'DELIVERED';

export interface LabHeader {
  name: string;
  addressLine: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  panNumber: string | null;
  accreditationNumber: string | null;
  reportFooter: string | null;
  logoDataUri: string | null;
  printLetterhead: boolean;
}

export interface ReportSignatoryLine {
  title: string;
  signatureDataUri: string | null;
}

export interface ReportParameterLine {
  name: string;
  unit: string | null;
  value: string | null;
  flag: ResultFlag;
  referenceText: string | null;
  comment: string | null;
  groupHeading: string | null;
}

export interface ReportTestBlock {
  testCode: string;
  testName: string;
  departmentName: string;
  method: string | null;
  specimen: string | null;
  accessionNumber: string | null;
  collectedAt: string | null;
  receivedAt: string | null;
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
  patientPhone?: string | null;
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
  signatories: ReportSignatoryLine[];
  tests: ReportTestBlock[];
}

export const REPORT_STATUS_TONE: Record<ReportStatus, 'neutral' | 'info' | 'success'> = {
  GENERATED: 'neutral',
  RELEASED: 'info',
  DELIVERED: 'success',
};

export interface VerificationResult {
  found?: boolean;
  valid?: boolean;
  reportNumber: string;
  reportVersion: number;
  reportType: string;
  status: string;
  patientMrn: string | null;
  patientNameMasked?: string | null;
  maskedPatientName?: string | null;
  patientGender: string | null;
  patientAgeYears: number | null;
  orderNumber: string | null;
  testNames: string[];
  labName?: string | null;
  laboratoryName?: string | null;
  labAddress?: string | null;
  laboratoryAddress?: string | null;
  labPhone?: string | null;
  laboratoryPhone?: string | null;
  labEmail?: string | null;
  laboratoryEmail?: string | null;
  panNumber: string | null;
  accreditationNumber: string | null;
  contentHash: string | null;
  signedBy: string | null;
  signerCredentials: string | null;
  signedAt: string | null;
  generatedAt?: string | null;
  releasedAt: string | null;
}
