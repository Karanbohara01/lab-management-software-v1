import { httpClient } from './client';
import type { CurrentUser, LoginRequest, TokenResponse } from '@/types/auth';

export const authApi = {
  login: (payload: LoginRequest) =>
    httpClient.post<TokenResponse>('/auth/login', payload).then((r) => r.data),

  me: () => httpClient.get<CurrentUser>('/auth/me').then((r) => r.data),

  logout: () => httpClient.post<void>('/auth/logout').then(() => undefined),
};
