import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  login as loginAction,
  register as registerAction,
  logout as logoutAction,
  getMe,
  clearError,
} from '@/store/authSlice';
import type { LoginFormData } from '@/utils/validation';
import type { RegisterFormData } from '@/utils/validation';

export function useAuth() {
  const dispatch = useAppDispatch();
  const { user, token, isAuthenticated, loading, initialized, error } = useAppSelector(
    (state) => state.auth
  );

  const login = useCallback(
    async (data: LoginFormData) => {
      const result = await dispatch(loginAction(data));
      return result;
    },
    [dispatch]
  );

  const register = useCallback(
    async (data: RegisterFormData) => {
      const result = await dispatch(
        registerAction({ name: data.name, email: data.email, password: data.password })
      );
      return result;
    },
    [dispatch]
  );

  const logout = useCallback(() => {
    dispatch(logoutAction());
  }, [dispatch]);

  const fetchUser = useCallback(() => {
    dispatch(getMe());
  }, [dispatch]);

  const resetError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    user,
    token,
    isAuthenticated,
    loading,
    initialized,
    error,
    login,
    register,
    logout,
    fetchUser,
    resetError,
  };
}
