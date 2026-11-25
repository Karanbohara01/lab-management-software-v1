import { httpClient } from '@/api/client';
import type { PageResponse } from '@/types/api';
import type { ReportDetail, ReportListItem, ReportStatus, VerificationResult } from './types';

export interface ReportQuery {
  status?: ReportStatus;
  patientId?: number;
  query?: string;
  page?: number;
  size?: number;
}

export const reportsApi = {
  list: (params: ReportQuery) =>
    httpClient.get<PageResponse<ReportListItem>>('/reports', { params }).then((r) => r.data),

  get: (id: number) => httpClient.get<ReportDetail>(`/reports/${id}`).then((r) => r.data),

  getByOrder: (orderId: number) =>
    httpClient.get<ReportDetail>(`/reports/by-order/${orderId}`).then((r) => r.data),

  generate: (orderId: number, preliminary = false) =>
    httpClient.post<ReportDetail>('/reports/generate', { orderId, preliminary }).then((r) => r.data),

  release: (id: number, signerCredentials?: string) =>
    httpClient.post<ReportDetail>(`/reports/${id}/release`, { signerCredentials }).then((r) => r.data),

  verify: (token: string) =>
    httpClient.get<VerificationResult>(`/reports/verify/${token}`).then((r) => r.data),

  getDocumentByToken: (token: string) =>
    httpClient.get<ReportDetail>(`/reports/verify/${token}/document`).then((r) => r.data),

  deliver: (id: number, method: string, recipient?: string) =>
    httpClient.post<ReportDetail>(`/reports/${id}/deliver`, { method, recipient }).then((r) => r.data),
};
