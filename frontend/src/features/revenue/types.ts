import type { InvoiceStatus, PaymentMethod, PaymentStatus } from '@/features/billing/types';

/** The reporting window the server resolved — the laboratory's calendar, not the browser's. */
export interface RevenuePeriod {
  from: string; // YYYY-MM-DD, inclusive
  to: string; // YYYY-MM-DD, inclusive
  days: number;
  zone: string;
  start: string;
  endExclusive: string;
}

export type RevenuePreset =
  | 'TODAY'
  | 'YESTERDAY'
  | 'LAST_7_DAYS'
  | 'LAST_30_DAYS'
  | 'THIS_WEEK'
  | 'LAST_WEEK'
  | 'THIS_MONTH'
  | 'LAST_MONTH'
  | 'THIS_YEAR';

export const REVENUE_PRESET_LABEL: Record<RevenuePreset, string> = {
  TODAY: 'Today',
  YESTERDAY: 'Yesterday',
  LAST_7_DAYS: 'Last 7 days',
  LAST_30_DAYS: 'Last 30 days',
  THIS_WEEK: 'This week',
  LAST_WEEK: 'Last week',
  THIS_MONTH: 'This month',
  LAST_MONTH: 'Last month',
  THIS_YEAR: 'This year',
};

export interface BillingSummary {
  invoiceCount: number;
  itemCount: number;
  testsOrdered: number;
  grossCharges: number;
  lineDiscounts: number;
  invoiceDiscounts: number;
  totalDiscounts: number;
  subtotal: number;
  taxableAmount: number;
  taxAmount: number;
  totalBilled: number;
  collectedToDate: number;
  outstanding: number;
  outstandingInvoiceCount: number;
}

export interface MethodTotal {
  method: PaymentMethod;
  transactions: number;
  amount: number;
}

export interface CashierTotal {
  receivedBy: string;
  transactions: number;
  amount: number;
}

export interface CollectionSummary {
  paymentCount: number;
  grossCollected: number;
  cashAndBank: number;
  onAccount: number;
  byMethod: MethodTotal[];
  byCashier: CashierTotal[];
}

export interface RefundSummary {
  count: number;
  amount: number;
}

export interface CancelledSummary {
  /** Invoices voided during the period, by cancellation date. */
  count: number;
  amount: number;
  /** Invoices issued in this period that have since been voided, whenever that happened. */
  issuedThenCancelledCount: number;
  issuedThenCancelledAmount: number;
  /** What the period was billed at the time: totalBilled + issuedThenCancelledAmount. */
  billedAsIssued: number;
}

export interface OutstandingSummary {
  amount: number;
  invoiceCount: number;
}

export interface Comparison {
  period: RevenuePeriod;
  totalBilled: number;
  grossCollected: number;
  refunds: number;
  netCollected: number;
  invoiceCount: number;
  paymentCount: number;
}

export interface LabHeader {
  name: string;
  addressLine: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  panNumber: string | null;
  logoDataUri: string | null;
  printLetterhead: boolean;
}

export interface RevenueSummary {
  period: RevenuePeriod;
  billing: BillingSummary;
  collections: CollectionSummary;
  refunds: RefundSummary;
  netCollected: number;
  cancelled: CancelledSummary;
  outstanding: OutstandingSummary;
  previous: Comparison;
  lab: LabHeader;
  generatedAt: string;
  generatedBy: string;
}

export interface TestRow {
  code: string;
  name: string;
  type: 'ANALYTE' | 'PROFILE' | null;
  department: string | null;
  category: string | null;
  timesOrdered: number;
  invoices: number;
  gross: number;
  discount: number;
  netBilled: number;
  collected: number;
  outstanding: number;
}

export interface GroupRow {
  label: string;
  tests: number;
  timesOrdered: number;
  gross: number;
  discount: number;
  netBilled: number;
  collected: number;
  outstanding: number;
}

export interface PatientCategoryRow {
  category: string;
  invoices: number;
  billed: number;
  discount: number;
  collected: number;
  outstanding: number;
}

export interface PayerRow {
  payerType: string;
  payerName: string | null;
  invoices: number;
  billed: number;
  collected: number;
  outstanding: number;
}

export interface ReferrerRow {
  doctorId: number | null;
  doctorName: string;
  invoices: number;
  billed: number;
  collected: number;
  outstanding: number;
}

export interface PatientOutstandingRow {
  patientId: number;
  mrn: string;
  patientName: string;
  invoices: number;
  outstanding: number;
}

export interface RevenueBreakdown {
  period: RevenuePeriod;
  byTest: TestRow[];
  byCategory: GroupRow[];
  byDepartment: GroupRow[];
  byPackage: GroupRow[];
  byPatientCategory: PatientCategoryRow[];
  byPayer: PayerRow[];
  byReferrer: ReferrerRow[];
  topOutstandingPatients: PatientOutstandingRow[];
}

export type Granularity = 'DAY' | 'WEEK' | 'MONTH';

export interface TrendPoint {
  bucket: string; // first local day of the bucket
  billed: number;
  collected: number;
  refunded: number;
  net: number;
}

export interface RevenueTrend {
  period: RevenuePeriod;
  granularity: Granularity;
  points: TrendPoint[];
}

export interface PaymentRow {
  id: number;
  receivedAt: string;
  invoiceId: number;
  invoiceNumber: string;
  invoiceStatus: InvoiceStatus;
  patientId: number;
  patientMrn: string;
  patientName: string;
  method: PaymentMethod;
  amount: number;
  reference: string | null;
  note: string | null;
  receivedBy: string;
  reversed: boolean;
  refundedAmount: number;
}

export interface RefundRow {
  id: number;
  decidedAt: string;
  requestedAt: string;
  invoiceId: number;
  invoiceNumber: string;
  patientId: number;
  patientMrn: string;
  patientName: string;
  amount: number;
  reason: string;
  requestedBy: string;
  decidedBy: string;
  paymentMethod: PaymentMethod | null;
}

export type OutstandingScope = 'PERIOD' | 'ALL';

export interface OutstandingRow {
  invoiceId: number;
  invoiceNumber: string;
  issuedAt: string;
  patientId: number;
  patientMrn: string;
  patientName: string;
  payerType: string;
  payerName: string | null;
  totalAmount: number;
  netPaid: number;
  balance: number;
  paymentStatus: PaymentStatus;
  daysOutstanding: number;
}

export interface Register<T> {
  rows: T[];
  total: number;
  truncated: boolean;
}

export interface RevenueReport {
  summary: RevenueSummary;
  breakdown: RevenueBreakdown;
  trend: RevenueTrend;
  payments: Register<PaymentRow>;
  refunds: Register<RefundRow>;
  outstanding: Register<OutstandingRow>;
}

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH: 'Cash',
  CARD: 'Card',
  BANK_TRANSFER: 'Bank transfer',
  DIGITAL_WALLET: 'Digital wallet',
  CHEQUE: 'Cheque',
  CREDIT: 'On account (credit)',
};

export const PAYER_TYPE_LABEL: Record<string, string> = {
  SELF: 'Self-paying',
  HEALTH_INSURANCE: 'Health insurance',
  SSF: 'Social Security Fund',
  CORPORATE: 'Corporate',
  EMBASSY: 'Embassy',
  NGO: 'NGO',
  GOVERNMENT: 'Government',
  OTHER: 'Other',
};

export const PATIENT_CATEGORY_LABEL: Record<string, string> = {
  WALK_IN: 'Walk-in',
  OPD_REFERRAL: 'OPD referral',
  IPD: 'In-patient',
  HEALTH_CAMP: 'Health camp',
  CORPORATE: 'Corporate',
  INSURANCE: 'Insurance',
  MEDICO_LEGAL: 'Medico-legal',
  STAFF: 'Staff',
  RESEARCH: 'Research',
};
