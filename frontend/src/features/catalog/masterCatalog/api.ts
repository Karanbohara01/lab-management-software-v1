import { httpClient } from '@/api/client';
import type { ImportResult, MasterTestDetail, MasterTestListItem, MasterTestUpsertPayload } from './types';

/** Platform-admin curation (PERM_PLATFORM_MANAGE) — creating/editing the shared catalogue. */
export const masterCatalogAdminApi = {
  list: () => httpClient.get<MasterTestListItem[]>('/platform/master-tests').then((r) => r.data),

  get: (id: number) => httpClient.get<MasterTestDetail>(`/platform/master-tests/${id}`).then((r) => r.data),

  create: (payload: MasterTestUpsertPayload) =>
    httpClient.post<MasterTestDetail>('/platform/master-tests', payload).then((r) => r.data),

  update: (id: number, payload: MasterTestUpsertPayload) =>
    httpClient.put<MasterTestDetail>(`/platform/master-tests/${id}`, payload).then((r) => r.data),

  setActive: (id: number, active: boolean) =>
    httpClient.post<void>(`/platform/master-tests/${id}/active`, null, { params: { active } }).then(() => undefined),
};

/** Clinic-facing browse + import (TEST_CATALOG_READ/WRITE — any clinic, not just platform admins). */
export const masterCatalogApi = {
  list: () => httpClient.get<MasterTestListItem[]>('/catalog/master-tests').then((r) => r.data),

  import: (masterTestIds: number[]) =>
    httpClient.post<ImportResult>('/catalog/master-tests/import', { masterTestIds }).then((r) => r.data),
};
