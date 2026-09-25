export type PaymentMethod = 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'DIGITAL_WALLET' | 'CHEQUE' | 'CREDIT';

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH: 'Cash',
  CARD: 'Card',
  BANK_TRANSFER: 'Bank transfer',
  DIGITAL_WALLET: 'Digital wallet',
  CHEQUE: 'Cheque',
  CREDIT: 'Credit',
};

export interface DoctorCommissionSummary {
  doctorId: number;
  doctorName: string;
  commissionRate: number | null;
  totalEarned: number;
  totalPaid: number;
  outstanding: number;
}

export interface CommissionEntryRow {
  id: number;
  doctorId: number;
  doctorName: string;
  invoiceId: number;
  invoiceNumber: string;
  orderId: number;
  orderNumber: string;
  baseAmount: number;
  rate: number;
  commissionAmount: number;
  earnedAt: string;
}

export interface CommissionPayoutRow {
  id: number;
  doctorId: number;
  amount: number;
  method: PaymentMethod;
  reference: string | null;
  note: string | null;
  paidAt: string;
  paidBy: string;
}

export interface PayoutPayload {
  doctorId: number;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  note?: string;
}
