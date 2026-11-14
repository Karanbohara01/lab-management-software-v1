import { httpClient } from '@/api/client';
import type { PageResponse } from '@/types/api';
import type {
  OrganizationDetail,
  OrganizationListItem,
  OrganizationStatus,
  Plan,
  PlatformDashboard,
  PlatformSummary,
  Subscription,
  SubscriptionStatus,
} from './types';

export interface PlatformRole {
  id: number;
  name: string;
  description: string | null;
  permissions: string[];
}

/** One of the leadership profiles on the public "About us" section, as the platform admin edits it. */
export interface LeadershipProfile {
  id: number;
  name: string;
  title: string;
  description: string | null;
  photoDataUri: string | null;
  linkedinUrl: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  threadsUrl: string | null;
  displayOrder: number;
  /** Shown on the public site — i.e. it has been given a name. */
  published: boolean;
}

export type LeadershipUpdate = Pick<
  LeadershipProfile,
  'name' | 'title' | 'description' | 'photoDataUri' | 'linkedinUrl' | 'facebookUrl' | 'instagramUrl' | 'threadsUrl'
>;

export const platformApi = {
  leadership: () => httpClient.get<LeadershipProfile[]>('/platform/leadership').then((r) => r.data),
  createLeadership: (payload: LeadershipUpdate) =>
    httpClient.post<LeadershipProfile>('/platform/leadership', payload).then((r) => r.data),
  updateLeadership: (id: LeadershipProfile['id'], payload: LeadershipUpdate) =>
    httpClient.put<LeadershipProfile>(`/platform/leadership/${id}`, payload).then((r) => r.data),
  deleteLeadership: (id: LeadershipProfile['id']) => httpClient.delete(`/platform/leadership/${id}`).then(() => undefined),

  summary: () => httpClient.get<PlatformSummary>('/platform/summary').then((r) => r.data),
  dashboard: () => httpClient.get<PlatformDashboard>('/platform/dashboard').then((r) => r.data),

  plans: () => httpClient.get<Plan[]>('/platform/plans').then((r) => r.data),
  upsertPlan: (payload: {
    code: string;
    name: string;
    priceMonthly: number;
    maxUsers: number;
    maxBranches: number;
    description?: string;
    active: boolean;
    displayOrder: number;
  }) => httpClient.post<Plan>('/platform/plans', payload).then((r) => r.data),

  organizations: (params: { query?: string; page?: number; size?: number }) =>
    httpClient.get<PageResponse<OrganizationListItem>>('/platform/organizations', { params }).then((r) => r.data),
  organization: (id: number) =>
    httpClient.get<OrganizationDetail>(`/platform/organizations/${id}`).then((r) => r.data),
  createOrganization: (payload: {
    slug: string;
    name: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
    city?: string;
    pan?: string;
    notes?: string;
    planCode: string;
    adminUsername: string;
    adminEmail: string;
    adminFullName: string;
    adminPassword: string;
  }) => httpClient.post<OrganizationDetail>('/platform/organizations', payload).then((r) => r.data),
  updateOrganization: (
    id: number,
    payload: {
      name: string;
      contactName?: string;
      contactEmail?: string;
      contactPhone?: string;
      city?: string;
      pan?: string;
      notes?: string;
    },
  ) => httpClient.put<OrganizationDetail>(`/platform/organizations/${id}`, payload).then((r) => r.data),
  changeStatus: (id: number, status: OrganizationStatus) =>
    httpClient.post<OrganizationDetail>(`/platform/organizations/${id}/status`, { status }).then((r) => r.data),

  changeSubscription: (
    id: number,
    payload: { planCode: string; status: SubscriptionStatus; currentPeriodEnd?: string; note?: string },
  ) => httpClient.post<Subscription>(`/platform/organizations/${id}/subscription`, payload).then((r) => r.data),
  cancelSubscription: (id: number, reason: string) =>
    httpClient.post<Subscription>(`/platform/organizations/${id}/subscription/cancel`, { reason }).then((r) => r.data),

  roles: () => httpClient.get<PlatformRole[]>('/platform/roles').then((r) => r.data),
  permissions: () => httpClient.get<string[]>('/platform/permissions').then((r) => r.data),
  updateRolePermissions: (roleId: number, permissionNames: string[]) =>
    httpClient
      .put<PlatformRole>(`/platform/roles/${roleId}/permissions`, { permissionNames })
      .then((r) => r.data),
};
