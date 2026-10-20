import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { apiClient } from './client';
import { ApiResponse } from '../types/api';
// Centralized HTTP client wrapper providing type-safe request dispatching and normalized error handling.
export const requestHandler = {
  // Dispatches an HTTP GET request and returns typed response data.
  get: async <T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> => {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await apiClient.get(
        url,
        config,
      );
      return response.data;
    } catch (error: unknown) {
      throw handleApiError(error);
    }
  },

  // Dispatches an HTTP POST request with an optional payload and returns typed response data.
  post: async <T, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> => {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await apiClient.post(
        url,
        data,
        config,
      );
      return response.data;
    } catch (error: unknown) {
      throw handleApiError(error);
    }
  },

  // Dispatches an HTTP PUT request with an update payload and returns typed response data.
  put: async <T, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> => {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await apiClient.put(
        url,
        data,
        config,
      );
      return response.data;
    } catch (error: unknown) {
      throw handleApiError(error);
    }
  },

  // Dispatches an HTTP DELETE request and returns typed response data.
  delete: async <T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> => {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await apiClient.delete(
        url,
        config,
      );
      return response.data;
    } catch (error: unknown) {
      throw handleApiError(error);
    }
  },

  // Dispatches an HTTP PATCH request for partial updates and returns typed response data.
  patch: async <T, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> => {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await apiClient.patch(
        url,
        data,
        config,
      );
      return response.data;
    } catch (error: unknown) {
      throw handleApiError(error);
    }
  },
};

// Represents a normalized API error containing HTTP status, message, and backend validation details.
export class ApiRequestError extends Error {
  status: number;
  success: boolean;
  errors?: unknown;
  originalError: unknown;

  constructor(
    message: string,
    status = 500,
    errors?: unknown,
    originalError?: unknown,
  ) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.success = false;
    this.errors = errors;
    this.originalError = originalError;
    Object.setPrototypeOf(this, ApiRequestError.prototype);
  }
}

// Inspects and normalizes Axios errors or native errors into an ApiRequestError instance.
function handleApiError(error: unknown) {
  let message = 'An unexpected error occurred';
  let status = 500;
  let validationErrors: unknown = undefined;

  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    message =
      data?.error?.message ||
      data?.message ||
      (typeof data?.error === 'string' ? data.error : '') ||
      error.message ||
      message;
    status = error.response?.status || status;
    validationErrors = data?.error?.errors || data?.errors;
  } else if (error instanceof Error) {
    message = error.message;
  }

  return new ApiRequestError(message, status, validationErrors, error);
}
