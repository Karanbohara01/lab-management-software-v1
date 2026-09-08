import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { authApi } from '@/api/auth';
import { ApiError } from '@/types/api';
import type { CurrentUser, LoginRequest } from '@/types/auth';
import { tokenStorage } from './tokenStorage';

type AuthStatus = 'idle' | 'bootstrapping' | 'authenticated' | 'unauthenticated';

interface AuthState {
  status: AuthStatus;
  user: CurrentUser | null;
  loginPending: boolean;
  loginError: string | null;
}

const initialState: AuthState = {
  status: 'idle',
  user: null,
  loginPending: false,
  loginError: null,
};

/** Restore a session on app start when tokens are present. */
export const bootstrapAuth = createAsyncThunk('auth/bootstrap', async () => {
  if (!tokenStorage.getAccess() && !tokenStorage.getRefresh()) {
    return null;
  }
  return authApi.me();
});

export const login = createAsyncThunk<
  CurrentUser,
  LoginRequest,
  { rejectValue: string }
>('auth/login', async (payload, { rejectWithValue }) => {
  try {
    const res = await authApi.login(payload);
    tokenStorage.set(res.accessToken, res.refreshToken);
    return res.user;
  } catch (err) {
    const message = err instanceof ApiError ? err.message : 'Unable to sign in';
    return rejectWithValue(message);
  }
});

export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await authApi.logout();
  } finally {
    tokenStorage.clear();
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    sessionExpired(state) {
      state.status = 'unauthenticated';
      state.user = null;
    },
    clearLoginError(state) {
      state.loginError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapAuth.pending, (state) => {
        state.status = 'bootstrapping';
      })
      .addCase(bootstrapAuth.fulfilled, (state, action: PayloadAction<CurrentUser | null>) => {
        state.user = action.payload;
        state.status = action.payload ? 'authenticated' : 'unauthenticated';
      })
      .addCase(bootstrapAuth.rejected, (state) => {
        tokenStorage.clear();
        state.status = 'unauthenticated';
        state.user = null;
      })
      .addCase(login.pending, (state) => {
        state.loginPending = true;
        state.loginError = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loginPending = false;
        state.user = action.payload;
        state.status = 'authenticated';
      })
      .addCase(login.rejected, (state, action) => {
        state.loginPending = false;
        state.loginError = action.payload ?? 'Unable to sign in';
      })
      .addCase(logout.fulfilled, (state) => {
        state.status = 'unauthenticated';
        state.user = null;
      });
  },
});

export const { sessionExpired, clearLoginError } = authSlice.actions;
export default authSlice.reducer;
