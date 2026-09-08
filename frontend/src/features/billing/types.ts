import type { DiscountType } from '@/features/orders/types';

export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'CANCELLED';
export type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERPAID';
export type PaymentMethod = 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'DIGITAL_WALLET' | 'CHEQUE' | 'CREDIT';
export type RefundStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED';

export interface InvoiceItem {
  id: number;
  testCode: string;
  testName: string;
  unitPrice: number;
  quantity: number;
  lineDiscount: number;
  lineTotal: number;
}

export interface PaymentEntry {
  id: number;
  amount: number;
  method: PaymentMethod;
  reference: string | null;
  note: string | null;
  receivedBy: string;
  receivedAt: string;
  reversed: boolean;
}

export interface RefundEntry {
  id: number;
  invoiceId: number;
  invoiceNumber: string | null;
  patientId: number;
  patientName: string;
  amount: number;
  reason: string;
  status: RefundStatus;
  paymentId: number | null;
  requestedBy: string;
  requestedAt: string;
  decidedBy: string | null;
  decidedAt: string | null;
  decisionNote: string | null;
}

export interface InvoiceListItem {
  id: number;
  invoiceNumber: string | null;
  orderId: number;
  orderNumber: string;
  patientId: number;
  patientName: string;
  patientMrn: string;
  status: InvoiceStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  balance: number;
  createdAt: string;
}

export interface InvoiceDetail {
  id: number;
  invoiceNumber: string | null;
  fiscalYear: string;
  orderId: number;
  orderNumber: string;
  patientId: number;
  patientName: string;
  patientMrn: string;
  patientGender: string;
  patientAgeYears: number | null;
  status: InvoiceStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  taxableAmount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  amountRefunded: number;
  balance: number;
  notes: string | null;
  cancelReason: string | null;
  issuedAt: string | null;
  issuedBy: string | null;
  items: InvoiceItem[];
  payments: PaymentEntry[];
  refunds: RefundEntry[];
}

export const INVOICE_STATUS_TONE: Record<InvoiceStatus, 'neutral' | 'info' | 'danger'> = {
  DRAFT: 'neutral',
  ISSUED: 'info',
  CANCELLED: 'danger',
};

export const PAYMENT_STATUS_TONE: Record<PaymentStatus, 'neutral' | 'warning' | 'success' | 'danger'> = {
  UNPAID: 'neutral',
  PARTIAL: 'warning',
  PAID: 'success',
  OVERPAID: 'danger',
};

export const REFUND_STATUS_TONE: Record<RefundStatus, 'warning' | 'success' | 'danger'> = {
  REQUESTED: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH: 'Cash',
  CARD: 'Card',
  BANK_TRANSFER: 'Bank transfer',
  DIGITAL_WALLET: 'Digital wallet',
  CHEQUE: 'Cheque',
  CREDIT: 'Credit',
};
