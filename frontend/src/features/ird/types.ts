export type IrdStatus =
  | 'NOT_SUBMITTED'
  | 'PENDING'
  | 'SUBMITTED'
  | 'ACCEPTED'
  | 'FAILED'
  | 'DUPLICATE'
  | 'CANCELLED';

export type AttemptAction = 'SUBMIT' | 'RETRY' | 'MANUAL' | 'CANCEL';
export type RequestStatus = 'PREPARED' | 'SENT' | 'SKIPPED';
export type ResponseStatus = 'ACCEPTED' | 'DUPLICATE' | 'REJECTED' | 'TRANSPORT_ERROR' | 'NOT_APPLICABLE';

export interface IrdConfig {
  enabled: boolean;
  environment: string;
  officiallyCertified: boolean;
  message: string;
}

export interface IrdAttempt {
  id: number;
  attemptNo: number;
  action: AttemptAction;
  requestStatus: RequestStatus;
  responseStatus: ResponseStatus | null;
  providerReference: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  actor: string;
  occurredAt: string;
}

export interface IrdSubmissionListItem {
  id: number;
  invoiceId: number;
  invoiceNumber: string | null;
  patientId: number;
  patientName: string;
  status: IrdStatus;
  attemptCount: number;
  manual: boolean;
  lastErrorMessage: string | null;
  submittedAt: string | null;
  updatedAt: string;
}

export interface IrdSubmissionDetail {
  id: number;
  invoiceId: number;
  invoiceNumber: string | null;
  patientId: number;
  patientName: string;
  patientMrn: string;
  status: IrdStatus;
  providerReference: string | null;
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
  attemptCount: number;
  manual: boolean;
  manualReference: string | null;
  notes: string | null;
  submittedAt: string | null;
  acceptedAt: string | null;
  attempts: IrdAttempt[];
}

export const IRD_STATUS_LABEL: Record<IrdStatus, string> = {
  NOT_SUBMITTED: 'Not submitted',
  PENDING: 'In progress',
  SUBMITTED: 'Submitted',
  ACCEPTED: 'Accepted',
  FAILED: 'Failed',
  DUPLICATE: 'Duplicate',
  CANCELLED: 'Cancelled',
};

export const IRD_STATUS_TONE: Record<IrdStatus, 'neutral' | 'info' | 'success' | 'warning' | 'danger'> = {
  NOT_SUBMITTED: 'neutral',
  PENDING: 'info',
  SUBMITTED: 'info',
  ACCEPTED: 'success',
  FAILED: 'danger',
  DUPLICATE: 'warning',
  CANCELLED: 'neutral',
};
