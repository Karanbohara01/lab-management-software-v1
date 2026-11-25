import { httpClient } from '@/api/client';
import type { PageResponse } from '@/types/api';
import type {
  CreateTicketRequest,
  AddMessageRequest,
  UpdateTicketStatusRequest,
  TicketSummary,
  TicketDetail,
  PlatformTicketStats,
  TicketStatus,
  TicketPriority,
  TicketCategory,
  UnreadCountResponse,
} from './types';

async function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const inquiriesApi = {
  clinic: {
    list: (
      filterOrStatus?: TicketStatus | { status?: TicketStatus; category?: TicketCategory; query?: string; page?: number; size?: number },
      legacyPage = 0,
      legacySize = 20
    ) => {
      const isObj = filterOrStatus && typeof filterOrStatus === 'object';
      const status = isObj ? filterOrStatus.status : filterOrStatus;
      const category = isObj ? filterOrStatus.category : undefined;
      const query = isObj ? filterOrStatus.query : undefined;
      const page = isObj ? (filterOrStatus.page ?? 0) : legacyPage;
      const size = isObj ? (filterOrStatus.size ?? 20) : legacySize;

      return httpClient
        .get<PageResponse<TicketSummary>>('/inquiries', {
          params: {
            status: status || undefined,
            category: category || undefined,
            query: query || undefined,
            page,
            size,
          },
        })
        .then((r) => r.data);
    },

    unreadCount: () =>
      httpClient.get<UnreadCountResponse>('/inquiries/unread-count').then((r) => r.data),

    get: (id: number) =>
      httpClient.get<TicketDetail>(`/inquiries/${id}`).then((r) => r.data),

    create: (payload: CreateTicketRequest) => {
      if (payload.file) {
        const formData = new FormData();
        const { file, ...data } = payload;
        formData.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }));
        formData.append('file', file);
        return httpClient
          .post<TicketDetail>('/inquiries', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
          .then((r) => r.data);
      }
      return httpClient.post<TicketDetail>('/inquiries', payload).then((r) => r.data);
    },

    addReply: (id: number, payload: AddMessageRequest) => {
      if (payload.file) {
        const formData = new FormData();
        const { file, ...data } = payload;
        formData.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }));
        formData.append('file', file);
        return httpClient
          .post<TicketDetail>(`/inquiries/${id}/messages`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
          .then((r) => r.data);
      }
      return httpClient.post<TicketDetail>(`/inquiries/${id}/messages`, payload).then((r) => r.data);
    },

    getAttachmentBlobUrl: async (ticketId: number, messageId: number) => {
      const res = await httpClient.get<Blob>(
        `/inquiries/${ticketId}/messages/${messageId}/attachment?inline=true`,
        { responseType: 'blob' }
      );
      return URL.createObjectURL(res.data);
    },

    downloadAttachment: async (ticketId: number, messageId: number, fileName: string) => {
      const res = await httpClient.get<Blob>(
        `/inquiries/${ticketId}/messages/${messageId}/attachment?inline=false`,
        { responseType: 'blob' }
      );
      await downloadBlob(res.data, fileName);
    },

    close: (id: number) =>
      httpClient.patch<TicketDetail>(`/inquiries/${id}/close`).then((r) => r.data),
  },

  platform: {
    search: (params?: {
      organizationId?: number;
      status?: TicketStatus;
      priority?: TicketPriority;
      query?: string;
      page?: number;
      size?: number;
    }) =>
      httpClient
        .get<PageResponse<TicketSummary>>('/platform/inquiries', {
          params: {
            organizationId: params?.organizationId || undefined,
            status: params?.status || undefined,
            priority: params?.priority || undefined,
            query: params?.query || undefined,
            page: params?.page ?? 0,
            size: params?.size ?? 20,
          },
        })
        .then((r) => r.data),

    get: (id: number) =>
      httpClient.get<TicketDetail>(`/platform/inquiries/${id}`).then((r) => r.data),

    addReply: (id: number, payload: AddMessageRequest) => {
      if (payload.file) {
        const formData = new FormData();
        const { file, ...data } = payload;
        formData.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }));
        formData.append('file', file);
        return httpClient
          .post<TicketDetail>(`/platform/inquiries/${id}/messages`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
          .then((r) => r.data);
      }
      return httpClient.post<TicketDetail>(`/platform/inquiries/${id}/messages`, payload).then((r) => r.data);
    },

    getAttachmentBlobUrl: async (ticketId: number, messageId: number) => {
      const res = await httpClient.get<Blob>(
        `/platform/inquiries/${ticketId}/messages/${messageId}/attachment?inline=true`,
        { responseType: 'blob' }
      );
      return URL.createObjectURL(res.data);
    },

    downloadAttachment: async (ticketId: number, messageId: number, fileName: string) => {
      const res = await httpClient.get<Blob>(
        `/platform/inquiries/${ticketId}/messages/${messageId}/attachment?inline=false`,
        { responseType: 'blob' }
      );
      await downloadBlob(res.data, fileName);
    },

    updateStatus: (id: number, payload: UpdateTicketStatusRequest) =>
      httpClient.patch<TicketDetail>(`/platform/inquiries/${id}/status`, payload).then((r) => r.data),

    getStats: () =>
      httpClient.get<PlatformTicketStats>('/platform/inquiries/stats').then((r) => r.data),
  },
};
