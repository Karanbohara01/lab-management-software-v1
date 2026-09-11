import { httpClient } from '@/api/client';
import type { PageResponse } from '@/types/api';
import type { DiscountType } from '@/features/orders/types';
import type {
  InvoiceDetail,
  InvoiceListItem,
  InvoiceStatus,
  PaymentMethod,
  RefundEntry,
  RefundStatus,
  CorrectionRow,
  MasterBillRow,
  SalesBookRow,
} from './types';

export interface InvoiceQuery {
  status?: InvoiceStatus;
  patientId?: number;
  branchId?: number;
  unpaidOnly?: boolean;
  query?: string;
  page?: number;
  size?: number;
}

export const invoicesApi = {
  list: (params: InvoiceQuery) =>
    httpClient.get<PageResponse<InvoiceListItem>>('/invoices', { params }).then((r) => r.data),

  get: (id: number) => httpClient.get<InvoiceDetail>(`/invoices/${id}`).then((r) => r.data),

  getByOrder: (orderId: number) =>
    httpClient.get<InvoiceDetail>(`/invoices/by-order/${orderId}`).then((r) => r.data),

  create: (orderId: number) =>
    httpClient.post<InvoiceDetail>('/invoices', { orderId }).then((r) => r.data),

  adjust: (
    id: number,
    payload: { discountType: DiscountType; discountValue: number; taxRate: number; notes?: string },
  ) => httpClient.put<InvoiceDetail>(`/invoices/${id}`, payload).then((r) => r.data),

  issue: (id: number) => httpClient.post<InvoiceDetail>(`/invoices/${id}/issue`).then((r) => r.data),

  cancel: (id: number, reason: string) =>
    httpClient.post<InvoiceDetail>(`/invoices/${id}/cancel`, { reason }).then((r) => r.data),

  recordPayment: (
    id: number,
    payload: { amount: number; method: PaymentMethod; reference?: string; note?: string },
  ) => httpClient.post<InvoiceDetail>(`/invoices/${id}/payments`, payload).then((r) => r.data),

  requestRefund: (id: number, payload: { amount: number; reason: string; paymentId?: number }) =>
    httpClient.post<RefundEntry>(`/invoices/${id}/refunds`, payload).then((r) => r.data),

  markPrinted: (id: number) => httpClient.post<InvoiceDetail>(`/invoices/${id}/print`).then((r) => r.data),

  salesBook: (params: { year: number; month: number; branchId?: number }) =>
    httpClient.get<SalesBookRow[]>('/invoices/sales-book', { params }).then((r) => r.data),

  masterBill: (params: { year: number; month: number; branchId?: number }) =>
    httpClient.get<MasterBillRow[]>('/invoices/master-bill', { params }).then((r) => r.data),

  corrections: (params: { year: number; month: number; branchId?: number }) =>
    httpClient.get<CorrectionRow[]>('/invoices/corrections', { params }).then((r) => r.data),

  /** Every invoice matching the filters, unpaged — for CSV/XML export (not for on-screen lists). */
  exportAll: (params: Omit<InvoiceQuery, 'page' | 'size'>) =>
    httpClient.get<InvoiceListItem[]>('/invoices/export', { params }).then((r) => r.data),
};

export const refundsApi = {
  list: (params: { status?: RefundStatus; page?: number; size?: number }) =>
    httpClient.get<PageResponse<RefundEntry>>('/refunds', { params }).then((r) => r.data),

  approve: (id: number, note?: string) =>
    httpClient.post<RefundEntry>(`/refunds/${id}/approve`, { note }).then((r) => r.data),

  reject: (id: number, note?: string) =>
    httpClient.post<RefundEntry>(`/refunds/${id}/reject`, { note }).then((r) => r.data),
};
