import { createApi, fetchBaseQuery, type BaseQueryFn, type FetchArgs, type FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import type { RootState } from '@/store/store';
import type { Task, User, PaginatedResponse, CreateTaskRequest, UpdateTaskRequest, ApiResponse } from '@/types';
import { logout } from '@/store/authSlice';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || '/api',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithAuthHandling: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  if (result.error && result.error.status === 401) {
    api.dispatch(logout());
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    window.location.href = '/login';
  }
  return result;
};

export const tasksApi = createApi({
  reducerPath: 'tasksApi',
  baseQuery: baseQueryWithAuthHandling,
  tagTypes: ['Task'],
  endpoints: (builder) => ({
    getTasks: builder.query<PaginatedResponse<Task>, { page?: number; limit?: number; status?: string; priority?: string; search?: string; sort?: string }>({
      query: ({ page = 1, limit = 10, status, priority, search, sort } = {}) => {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('limit', String(limit));
        if (status) params.append('status', status);
        if (priority) params.append('priority', priority);
        if (search) params.append('search', search);
        if (sort) params.append('sort', sort);
        return `/tasks?${params.toString()}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.data.tasks.map(({ _id }) => ({ type: 'Task' as const, id: _id })),
              { type: 'Task', id: 'LIST' },
            ]
          : [{ type: 'Task', id: 'LIST' }],
    }),
    getTask: builder.query<ApiResponse<{ task: Task }>, string>({
      query: (id) => `/tasks/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Task', id }],
    }),
    createTask: builder.mutation<ApiResponse<{ task: Task }>, CreateTaskRequest>({
      query: (data) => ({
        url: '/tasks',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Task', id: 'LIST' }],
    }),
    updateTask: builder.mutation<ApiResponse<{ task: Task }>, { id: string; data: UpdateTaskRequest }>({
      query: ({ id, data }) => ({
        url: `/tasks/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Task', id },
        { type: 'Task', id: 'LIST' },
      ],
    }),
    deleteTask: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({
        url: `/tasks/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Task', id },
        { type: 'Task', id: 'LIST' },
      ],
    }),
    duplicateTask: builder.mutation<ApiResponse<{ task: Task }>, string>({
      query: (id) => ({
        url: `/tasks/${id}/duplicate`,
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'Task', id: 'LIST' }],
    }),
    getUsers: builder.query<ApiResponse<{ users: User[] }>, void>({
      query: () => '/users',
    }),
  }),
});

export const {
  useGetTasksQuery,
  useGetTaskQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useDuplicateTaskMutation,
  useGetUsersQuery,
} = tasksApi;
