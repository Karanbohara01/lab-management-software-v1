import { httpClient } from './client';
import type { CurrentUser, ForgotPasswordRequest, LoginRequest, ResetPasswordRequest, TokenResponse } from '@/types/auth';

export const authApi = {
  login: (payload: LoginRequest) =>
    httpClient.post<TokenResponse>('/auth/login', payload).then((r) => r.data),

  me: () => httpClient.get<CurrentUser>('/auth/me').then((r) => r.data),

  logout: () => httpClient.post<void>('/auth/logout').then(() => undefined),

  forgotPassword: (payload: ForgotPasswordRequest) =>
    httpClient.post<void>('/auth/forgot-password', payload).then(() => undefined),

  resetPassword: (payload: ResetPasswordRequest) =>
    httpClient.post<void>('/auth/reset-password', payload).then(() => undefined),
};
