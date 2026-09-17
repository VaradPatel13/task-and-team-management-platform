import type { AxiosError } from 'axios';

export interface ApiError {
  message: string;
  field?: string;
  status?: number;
  errors?: { field: string; message: string }[];
}

export function extractApiError(error: unknown): ApiError {
  const axiosError = error as AxiosError<{
    success: boolean;
    error: string;
    errors?: { field: string; message: string }[];
  }>;

  if (!axiosError.response) {
    return { message: 'Network error. Please check your connection.', status: 0 };
  }

  const { status, data } = axiosError.response;

  if (data?.errors && data.errors.length > 0) {
    return {
      message: data.error || 'Validation failed',
      errors: data.errors,
      status,
    };
  }

  if (data?.error) {
    return { message: data.error, status };
  }

  switch (status) {
    case 400:
      return { message: 'Invalid request. Please check your input.', status };
    case 401:
      return { message: 'Unauthorized. Please log in again.', status };
    case 403:
      return { message: 'You do not have permission to perform this action.', status };
    case 404:
      return { message: 'Resource not found.', status };
    case 409:
      return { message: 'A conflict occurred. The resource may already exist.', status };
    case 500:
      return { message: 'Server error. Please try again later.', status };
    default:
      return { message: 'An unexpected error occurred.', status };
  }
}

export function getFieldError(
  errors: { field: string; message: string }[] | undefined,
  fieldName: string
): string | undefined {
  return errors?.find((e) => e.field === fieldName)?.message;
}
