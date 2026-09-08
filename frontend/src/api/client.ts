import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';
import { ApiError, type ApiErrorBody } from '@/types/api';
import { tokenStorage } from '@/features/auth/tokenStorage';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

let onSessionExpired: (() => void) | null = null;
export function registerSessionExpiredHandler(handler: () => void): void {
  onSessionExpired = handler;
}

export const httpClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

httpClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.getAccess();
  if (token) config.headers.set('Authorization', `Bearer ${token}`);
  return config;
});

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refreshToken = tokenStorage.getRefresh();
  if (!refreshToken) throw new Error('No refresh token');
  const { data } = await axios.post<{ accessToken: string; refreshToken: string }>(
    `${BASE_URL}/auth/refresh`,
    { refreshToken },
  );
  tokenStorage.set(data.accessToken, data.refreshToken);
  return data.accessToken;
}

httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorBody>) => {
    const original = error.config as RetriableConfig | undefined;
    const status = error.response?.status;
    const isAuthEndpoint = original?.url?.includes('/auth/');

    if (status === 401 && original && !original._retry && !isAuthEndpoint && tokenStorage.getRefresh()) {
      original._retry = true;
      try {
        refreshPromise ??= refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
        const newToken = await refreshPromise;
        original.headers.set('Authorization', `Bearer ${newToken}`);
        return httpClient(original);
      } catch {
        tokenStorage.clear();
        onSessionExpired?.();
        return Promise.reject(new ApiError(sessionExpiredBody(original?.url)));
      }
    }

    if (error.response?.data?.code) {
      return Promise.reject(new ApiError(error.response.data));
    }
    return Promise.reject(
      new ApiError({
        code: 'NETWORK_ERROR',
        message: error.message || 'Unable to reach the server',
        status: status ?? 0,
        path: original?.url ?? '',
        timestamp: new Date().toISOString(),
      }),
    );
  },
);

function sessionExpiredBody(path?: string): ApiErrorBody {
  return {
    code: 'AUTHENTICATION_REQUIRED',
    message: 'Your session has expired. Please sign in again.',
    status: 401,
    path: path ?? '',
    timestamp: new Date().toISOString(),
  };
}
