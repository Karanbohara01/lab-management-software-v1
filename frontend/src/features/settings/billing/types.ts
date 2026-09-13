export type SubscriptionInvoiceStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
export type SubscriptionStatus = 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED' | 'CANCELLED';

export interface MySubscription {
  planCode: string;
  planName: string;
  priceMonthly: number;
  maxUsers: number;
  maxBranches: number;
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
  pendingPlanCode: string | null;
  pendingPlanName: string | null;
  pendingPlanRequestedAt: string | null;
}

export interface SubscriptionInvoice {
  id: number;
  invoiceNumber: string;
  planCode: string;
  planName: string;
  amount: number;
  periodStart: string;
  periodEnd: string;
  dueAt: string;
  status: SubscriptionInvoiceStatus;
  paidAt: string | null;
  paymentReference: string | null;
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
