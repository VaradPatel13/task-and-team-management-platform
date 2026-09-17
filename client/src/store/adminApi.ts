import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '@/store/store';
import type { User, Task, PaginatedResponse, ApiResponse } from '@/types';

interface AdminStats {
  totalUsers: number;
  totalTasks: number;
  tasksByStatus: { pending: number; 'in-progress': number; completed: number };
  tasksByPriority: { low: number; medium: number; high: number };
  recentTasks: Task[];
}

interface AdminUsersResponse {
  users: User[];
  page: number;
  pages: number;
  total: number;
}

export const adminApi = createApi({
  reducerPath: 'adminApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || '/api',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['AdminStats', 'AdminUsers', 'AdminTasks'],
  endpoints: (builder) => ({
    getAdminStats: builder.query<ApiResponse<AdminStats>, void>({
      query: () => '/admin/stats',
      providesTags: ['AdminStats'],
    }),
    getAdminUsers: builder.query<
      ApiResponse<AdminUsersResponse>,
      { page?: number; limit?: number; search?: string }
    >({
      query: ({ page = 1, limit = 20, search }) => {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('limit', String(limit));
        if (search) params.set('search', search);
        return `/admin/users?${params.toString()}`;
      },
      providesTags: ['AdminUsers'],
    }),
    getAdminTasks: builder.query<
      ApiResponse<PaginatedResponse<Task>>,
      { page?: number; limit?: number; status?: string; priority?: string; search?: string }
    >({
      query: ({ page = 1, limit = 20, status, priority, search }) => {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('limit', String(limit));
        if (status) params.set('status', status);
        if (priority) params.set('priority', priority);
        if (search) params.set('search', search);
        return `/admin/tasks?${params.toString()}`;
      },
      providesTags: ['AdminTasks'],
    }),
  }),
});

export const { useGetAdminStatsQuery, useGetAdminUsersQuery, useGetAdminTasksQuery } = adminApi;
