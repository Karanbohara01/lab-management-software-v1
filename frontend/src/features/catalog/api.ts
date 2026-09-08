import { httpClient } from '@/api/client';
import type { PageResponse } from '@/types/api';
import type { TestDetail, TestListItem, TestUpsertPayload } from './types';

export interface TestQuery {
  query?: string;
  departmentId?: number;
  activeOnly?: boolean;
  page?: number;
  size?: number;
}

export const testCatalogApi = {
  list: (params: TestQuery) =>
    httpClient.get<PageResponse<TestListItem>>('/tests', { params }).then((r) => r.data),

  get: (id: number) => httpClient.get<TestDetail>(`/tests/${id}`).then((r) => r.data),

  create: (payload: TestUpsertPayload) =>
    httpClient.post<TestDetail>('/tests', payload).then((r) => r.data),

  update: (id: number, payload: Omit<TestUpsertPayload, 'code'>) =>
    httpClient.put<TestDetail>(`/tests/${id}`, payload).then((r) => r.data),

  setActive: (id: number, value: boolean) =>
    httpClient.patch<TestDetail>(`/tests/${id}/active`, null, { params: { value } }).then((r) => r.data),
};
