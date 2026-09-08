import { httpClient } from '@/api/client';
import type { PageResponse } from '@/types/api';
import type {
  CommentTemplate,
  ContactMethod,
  ResultDetail,
  ResultListItem,
  ResultStatus,
  ValueInput,
} from './types';

export interface ResultQuery {
  status?: ResultStatus;
  departmentId?: number;
  sampleId?: number;
  orderId?: number;
  patientId?: number;
  criticalOnly?: boolean;
  overdueOnly?: boolean;
  criticalPendingOnly?: boolean;
  query?: string;
  page?: number;
  size?: number;
}

export const resultsApi = {
  list: (params: ResultQuery) =>
    httpClient.get<PageResponse<ResultListItem>>('/results', { params }).then((r) => r.data),

  summary: (departmentId?: number) =>
    httpClient
      .get<{ counts: Record<string, number> }>('/results/summary', { params: { departmentId } })
      .then((r) => r.data.counts),

  get: (id: number) => httpClient.get<ResultDetail>(`/results/${id}`).then((r) => r.data),

  commentTemplates: (testId?: number) =>
    httpClient
      .get<CommentTemplate[]>('/result-comment-templates/applicable', { params: { testId } })
      .then((r) => r.data),

  saveValues: (id: number, values: ValueInput[], comment?: string) =>
    httpClient.put<ResultDetail>(`/results/${id}/values`, { values, comment }).then((r) => r.data),

  verify: (id: number) => httpClient.post<ResultDetail>(`/results/${id}/verify`).then((r) => r.data),

  logCriticalCallback: (
    id: number,
    body: {
      notifiedName: string;
      notifiedRole?: string;
      contactMethod: ContactMethod;
      readBackConfirmed: boolean;
      remarks?: string;
    },
  ) => httpClient.post<ResultDetail>(`/results/${id}/critical-callback`, body).then((r) => r.data),

  waiveCriticalCallback: (id: number, reason: string) =>
    httpClient.post<ResultDetail>(`/results/${id}/critical-callback/waive`, { reason }).then((r) => r.data),

  approve: (id: number, qcOverrideReason?: string) =>
    httpClient.post<ResultDetail>(`/results/${id}/approve`, { qcOverrideReason }).then((r) => r.data),

  reject: (id: number, reason: string) =>
    httpClient.post<ResultDetail>(`/results/${id}/reject`, { reason }).then((r) => r.data),

  amend: (id: number, values: ValueInput[], reason: string, comment?: string) =>
    httpClient.post<ResultDetail>(`/results/${id}/amend`, { values, reason, comment }).then((r) => r.data),
};
