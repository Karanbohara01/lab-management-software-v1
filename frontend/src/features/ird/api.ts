import { httpClient } from '@/api/client';
import type { PageResponse } from '@/types/api';
import type { IrdConfig, IrdStatus, IrdSubmissionDetail, IrdSubmissionListItem } from './types';

export const irdApi = {
  config: () => httpClient.get<IrdConfig>('/ird/config').then((r) => r.data),

  list: (params: { status?: IrdStatus; query?: string; page?: number; size?: number }) =>
    httpClient.get<PageResponse<IrdSubmissionListItem>>('/ird/submissions', { params }).then((r) => r.data),

  summary: () =>
    httpClient.get<{ counts: Record<string, number> }>('/ird/submissions/summary').then((r) => r.data.counts),

  get: (id: number) => httpClient.get<IrdSubmissionDetail>(`/ird/submissions/${id}`).then((r) => r.data),

  getByInvoice: (invoiceId: number) =>
    httpClient.get<IrdSubmissionDetail>(`/ird/submissions/by-invoice/${invoiceId}`).then((r) => r.data),

  submit: (invoiceId: number) =>
    httpClient.post<IrdSubmissionDetail>('/ird/submissions/submit', { invoiceId }).then((r) => r.data),

  retry: (id: number) => httpClient.post<IrdSubmissionDetail>(`/ird/submissions/${id}/retry`).then((r) => r.data),

  markManual: (id: number, reference: string, note?: string) =>
    httpClient.post<IrdSubmissionDetail>(`/ird/submissions/${id}/manual`, { reference, note }).then((r) => r.data),

  cancel: (id: number, reason: string) =>
    httpClient.post<IrdSubmissionDetail>(`/ird/submissions/${id}/cancel`, { reason }).then((r) => r.data),

  submitCreditNote: (id: number) =>
    httpClient.post<IrdSubmissionDetail>(`/ird/submissions/${id}/credit-note/submit`).then((r) => r.data),

  retryCreditNote: (id: number) =>
    httpClient.post<IrdSubmissionDetail>(`/ird/submissions/${id}/credit-note/retry`).then((r) => r.data),
};
