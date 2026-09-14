import { httpClient } from '@/api/client';
import type { PageResponse } from '@/types/api';
import type { IrdStatus } from '@/features/ird/types';
import type { PlatformInvoiceListItem, PlatformIrdConfig, PlatformIrdSubmissionDetail } from './types';

export const platformBillingApi = {
  config: () => httpClient.get<PlatformIrdConfig>('/platform/billing/ird/config').then((r) => r.data),

  list: (params: { irdStatus?: IrdStatus; organizationId?: number; page?: number; size?: number }) =>
    httpClient
      .get<PageResponse<PlatformInvoiceListItem>>('/platform/subscription-invoices', { params })
      .then((r) => r.data),

  getByInvoice: (invoiceId: number) =>
    httpClient.get<PlatformIrdSubmissionDetail>(`/platform/subscription-invoices/${invoiceId}/ird`).then((r) => r.data),

  submit: (submissionId: number) =>
    httpClient
      .post<PlatformIrdSubmissionDetail>(`/platform/subscription-invoices/ird/${submissionId}/submit`)
      .then((r) => r.data),

  retry: (submissionId: number) =>
    httpClient
      .post<PlatformIrdSubmissionDetail>(`/platform/subscription-invoices/ird/${submissionId}/retry`)
      .then((r) => r.data),

  markManual: (submissionId: number, reference: string, note?: string) =>
    httpClient
      .post<PlatformIrdSubmissionDetail>(`/platform/subscription-invoices/ird/${submissionId}/manual`, { reference, note })
      .then((r) => r.data),
};
