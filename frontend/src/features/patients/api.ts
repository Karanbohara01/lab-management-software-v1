import { httpClient } from '@/api/client';
import { tokenStorage } from '@/features/auth/tokenStorage';
import type { PageResponse } from '@/types/api';
import type {
  MatchCandidate,
  MatchQuery,
  MergePreview,
  PatientCategory,
  PatientDetail,
  PatientDocument,
  PatientListItem,
  PatientUpsertPayload,
  UploadPatientDocumentRequest,
} from './types';

export interface PatientQuery {
  query?: string;
  category?: PatientCategory;
  activeOnly?: boolean;
  page?: number;
  size?: number;
}

export const patientsApi = {
  list: (params: PatientQuery) =>
    httpClient.get<PageResponse<PatientListItem>>('/patients', { params }).then((r) => r.data),

  get: (id: number) => httpClient.get<PatientDetail>(`/patients/${id}`).then((r) => r.data),

  match: (payload: MatchQuery) =>
    httpClient.post<MatchCandidate[]>('/patients/match', payload).then((r) => r.data),

  create: (payload: PatientUpsertPayload) =>
    httpClient.post<PatientDetail>('/patients', payload).then((r) => r.data),

  update: (id: number, payload: PatientUpsertPayload) =>
    httpClient.put<PatientDetail>(`/patients/${id}`, payload).then((r) => r.data),

  setActive: (id: number, value: boolean) =>
    httpClient.patch<PatientDetail>(`/patients/${id}/active`, null, { params: { value } }).then((r) => r.data),

  mergePreview: (survivorId: number, duplicateId: number) =>
    httpClient
      .get<MergePreview>(`/patients/${survivorId}/merge-preview`, { params: { duplicateId } })
      .then((r) => r.data),

  merge: (survivorId: number, payload: { duplicateId: number; reason: string }) =>
    httpClient.post<PatientDetail>(`/patients/${survivorId}/merge`, payload).then((r) => r.data),

  /** Generates (on first call) and returns this patient's self-service portal link, to share manually. */
  portalLink: (id: number) =>
    httpClient.get<{ url: string }>(`/patients/${id}/portal-link`).then((r) => r.data),

  documents: {
    list: (patientId: number) =>
      httpClient.get<PatientDocument[]>(`/patients/${patientId}/documents`).then((r) => r.data),

    upload: (patientId: number, data: UploadPatientDocumentRequest, file: File) => {
      const formData = new FormData();
      formData.append(
        'data',
        new Blob([JSON.stringify(data)], { type: 'application/json' })
      );
      formData.append('file', file);
      return httpClient
        .post<PatientDocument>(`/patients/${patientId}/documents`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then((r) => r.data);
    },

    downloadUrl: (patientId: number, documentId: number, inline = false) => {
      const token = tokenStorage.getAccess();
      const tokenParam = token ? `&token=${encodeURIComponent(token)}` : '';
      return `/api/patients/${patientId}/documents/${documentId}/download?inline=${inline}${tokenParam}`;
    },

    download: async (patientId: number, documentId: number, fileName: string) => {
      const res = await httpClient.get<Blob>(`/patients/${patientId}/documents/${documentId}/download`, {
        responseType: 'blob',
      });
      const blobUrl = URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    },

    getBlobUrl: async (patientId: number, documentId: number) => {
      const res = await httpClient.get<Blob>(
        `/patients/${patientId}/documents/${documentId}/download?inline=true`,
        { responseType: 'blob' }
      );
      return URL.createObjectURL(res.data);
    },

    delete: (patientId: number, documentId: number) =>
      httpClient.delete<void>(`/patients/${patientId}/documents/${documentId}`).then((r) => r.data),
  },
};
