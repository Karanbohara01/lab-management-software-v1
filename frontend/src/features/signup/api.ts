import { httpClient } from '@/api/client';

export interface PublicPlan {
  id: number;
  code: string;
  name: string;
  priceMonthly: number;
  maxUsers: number;
  maxBranches: number;
  description: string | null;
  active: boolean;
  displayOrder: number;
}

export interface SignupRequest {
  slug: string;
  name: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  city?: string;
  notes?: string;
  planCode: string;
  adminUsername: string;
  adminEmail: string;
  adminFullName: string;
  adminPassword: string;
}

export interface SignupResponse {
  id: number;
  slug: string;
  name: string;
}

export const signupApi = {
  plans: () => httpClient.get<PublicPlan[]>('/public/plans').then((r) => r.data),

  signup: (payload: SignupRequest) =>
    httpClient.post<SignupResponse>('/public/signup', payload).then((r) => r.data),
};
