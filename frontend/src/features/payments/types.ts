export type PaymentProvider = 'ESEWA' | 'KHALTI' | 'FONEPAY';
export type OnlinePaymentStatus = 'INITIATED' | 'VERIFIED' | 'FAILED';
export type VatRefundReportStatus = 'NOT_APPLICABLE' | 'SENT' | 'FAILED' | 'NOT_SUPPORTED';

export interface ProviderStatus {
  provider: PaymentProvider;
  configured: boolean;
}

export interface InitiateResponse {
  onlinePaymentId: number;
  redirectUrl: string | null;
  formAction: string | null;
  formFields: Record<string, string> | null;
}

export interface OnlinePayment {
  id: number;
  invoiceId: number;
  provider: PaymentProvider;
  status: OnlinePaymentStatus;
  amount: number;
  transactionUuid: string;
  providerReference: string | null;
  initiatedAt: string;
  initiatedBy: string;
  verifiedAt: string | null;
  failureReason: string | null;
  vatRefundReportStatus: VatRefundReportStatus;
  vatRefundAmount: number | null;
  vatRefundError: string | null;
}

export const PROVIDER_LABEL: Record<PaymentProvider, string> = {
  ESEWA: 'eSewa',
  KHALTI: 'Khalti',
  FONEPAY: 'Fonepay',
};
