import { httpClient } from '@/api/client';

export type NotificationSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface AppNotification {
  id: number;
  type: string;
  severity: NotificationSeverity;
  title: string;
  message: string | null;
  linkPath: string | null;
  read: boolean;
  createdAt: string;
}

export const notificationsApi = {
  list: (unreadOnly = false, limit = 50) =>
    httpClient.get<AppNotification[]>('/notifications', { params: { unreadOnly, limit } }).then((r) => r.data),
  unreadCount: () =>
    httpClient.get<{ count: number }>('/notifications/unread-count').then((r) => r.data.count),
  markRead: (id: number) => httpClient.post(`/notifications/${id}/read`).then(() => undefined),
  markAllRead: () => httpClient.post('/notifications/read-all').then(() => undefined),
};
