import { describe, expect, it, vi, beforeEach } from 'vitest';
import reducer, { sessionExpired, login } from './authSlice';
import { authApi } from '@/api/auth';
import { tokenStorage } from './tokenStorage';

vi.mock('@/api/auth', () => ({
  authApi: { login: vi.fn(), me: vi.fn(), logout: vi.fn() },
}));

const initial = reducer(undefined, { type: '@@INIT' });

describe('authSlice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tokenStorage.clear();
  });

  it('starts unauthenticated and idle', () => {
    expect(initial.status).toBe('idle');
    expect(initial.user).toBeNull();
  });

  it('sessionExpired clears the user', () => {
    const authed = { ...initial, status: 'authenticated' as const, user: { id: 1 } as never };
    expect(reducer(authed, sessionExpired()).status).toBe('unauthenticated');
    expect(reducer(authed, sessionExpired()).user).toBeNull();
  });

  it('login.fulfilled stores the user and persists tokens', async () => {
    const user = { id: 7, username: 'reception', email: 'r@x', fullName: 'R', roles: [], permissions: [] };
    vi.mocked(authApi.login).mockResolvedValue({
      accessToken: 'a', refreshToken: 'b', tokenType: 'Bearer', expiresInSeconds: 1800, user,
    });

    const dispatch = vi.fn();
    const thunk = login({ username: 'reception', password: 'x' });
    const result = await thunk(dispatch, () => ({}) as never, undefined);

    expect(result.type).toBe('auth/login/fulfilled');
    expect(tokenStorage.getAccess()).toBe('a');
    expect(reducer(initial, result).user).toEqual(user);
  });
});
