import type { IrdStatus } from '@/features/ird/types';

export type SubscriptionInvoiceStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface PlatformInvoiceListItem {
  id: number;
  invoiceNumber: string;
  organizationId: number;
  organizationName: string | null;
  planName: string;
  totalAmount: number;
  taxAmount: number;
  periodStart: string;
  periodEnd: string;
  dueAt: string;
  status: SubscriptionInvoiceStatus;
  paidAt: string | null;
  irdStatus: IrdStatus;
}

export interface PlatformIrdSubmissionDetail {
  id: number;
  subscriptionInvoiceId: number;
  invoiceNumber: string;
  organizationId: number;
  organizationName: string | null;
  planName: string;
  taxableAmount: number;
  taxAmount: number;
  totalAmount: number;
  invoiceStatus: SubscriptionInvoiceStatus;
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
}

export interface PlatformIrdConfig {
  configured: boolean;
  environment: string;
  message: string;
}

export interface PlatformIrdCredentials {
  enabled: boolean;
  username: string | null;
  sellerPan: string | null;
  sellerName: string | null;
  passwordConfigured: boolean;
}

export const SUBSCRIPTION_INVOICE_STATUS_LABEL: Record<SubscriptionInvoiceStatus, string> = {
  PENDING: 'Payment due',
  PAID: 'Paid',
  OVERDUE: 'Overdue',
  CANCELLED: 'Cancelled',
};

export const SUBSCRIPTION_INVOICE_STATUS_TONE: Record<SubscriptionInvoiceStatus, 'neutral' | 'info' | 'success' | 'warning' | 'danger'> = {
  PENDING: 'info',
  PAID: 'success',
  OVERDUE: 'danger',
  CANCELLED: 'neutral',
};
