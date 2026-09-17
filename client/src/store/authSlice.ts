import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { User } from '@/types';
import { api } from '@/services/api';

function getToken(): string | null {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}

function setToken(token: string, rememberMe: boolean) {
  if (rememberMe) {
    localStorage.setItem('token', token);
  } else {
    sessionStorage.setItem('token', token);
  }
}

function clearToken() {
  localStorage.removeItem('token');
  sessionStorage.removeItem('token');
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  initialized: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: getToken(),
  isAuthenticated: false,
  loading: false,
  initialized: !getToken(),
  error: null,
};

export const login = createAsyncThunk(
  'auth/login',
  async (
    { email, password, rememberMe }: { email: string; password: string; rememberMe?: boolean },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post('/auth/login', { email, password, rememberMe });
      const { user, token } = response.data.data;
      setToken(token, rememberMe ?? false);
      return { user, token };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(err.response?.data?.error || 'Login failed');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (
    { name, email, password }: { name: string; email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post('/auth/register', { name, email, password });
      const { user, token } = response.data.data;
      setToken(token, false);
      return { user, token };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(err.response?.data?.error || 'Registration failed');
    }
  }
);

export const getMe = createAsyncThunk('auth/getMe', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/auth/me');
    return response.data.data.user;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { error?: string } } };
    return rejectWithValue(err.response?.data?.error || 'Failed to get user');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      clearToken();
    },
    clearError(state) {
      state.error = null;
    },
    resetAuth(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      clearToken();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.initialized = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.initialized = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getMe.pending, (state) => {
        if (!state.initialized) {
          state.loading = true;
        }
      })
      .addCase(getMe.fulfilled, (state, action) => {
        state.loading = false;
        state.initialized = true;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(getMe.rejected, (state) => {
        state.loading = false;
        state.initialized = true;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        clearToken();
      });
  },
});

export const { logout, clearError, resetAuth } = authSlice.actions;
export default authSlice.reducer;
