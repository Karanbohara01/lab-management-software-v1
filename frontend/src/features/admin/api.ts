import { httpClient } from '@/api/client';
import type { PageResponse } from '@/types/api';

export interface AuditListItem {
  id: number;
  actor: string;
  action: string;
  module: string;
  entityType: string | null;
  entityId: string | null;
  summary: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface AuditDetail extends AuditListItem {
  beforeState: string | null;
  afterState: string | null;
}

export interface AppRole {
  id: number;
  name: string;
  description: string | null;
  permissions: string[];
}

export interface AppUserListItem {
  id: number;
  username: string;
  fullName: string;
  email: string;
  roles: string[];
  enabled: boolean;
  lastLoginAt: string | null;
}

export interface AppUserDetail extends AppUserListItem {
  phone: string | null;
  createdAt: string;
}

export interface AuditQuery {
  module?: string;
  actor?: string;
  query?: string;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

export const adminApi = {
  audit: (params: AuditQuery) =>
    httpClient.get<PageResponse<AuditListItem>>('/audit-logs', { params }).then((r) => r.data),
  auditModules: () => httpClient.get<string[]>('/audit-logs/modules').then((r) => r.data),
  auditDetail: (id: number) => httpClient.get<AuditDetail>(`/audit-logs/${id}`).then((r) => r.data),

  roles: () => httpClient.get<AppRole[]>('/roles').then((r) => r.data),

  users: (params: { query?: string; enabledOnly?: boolean; page?: number; size?: number }) =>
    httpClient.get<PageResponse<AppUserListItem>>('/users', { params }).then((r) => r.data),
  user: (id: number) => httpClient.get<AppUserDetail>(`/users/${id}`).then((r) => r.data),
  createUser: (payload: {
    username: string;
    email: string;
    fullName: string;
    phone?: string;
    roleNames: string[];
    password: string;
  }) => httpClient.post<AppUserDetail>('/users', payload).then((r) => r.data),
  updateUser: (id: number, payload: { email: string; fullName: string; phone?: string; roleNames: string[] }) =>
    httpClient.put<AppUserDetail>(`/users/${id}`, payload).then((r) => r.data),
  setEnabled: (id: number, value: boolean) =>
    httpClient.patch<AppUserDetail>(`/users/${id}/enabled`, null, { params: { value } }).then((r) => r.data),
  resetPassword: (id: number, newPassword: string) =>
    httpClient.post(`/users/${id}/reset-password`, { newPassword }).then(() => undefined),
};
