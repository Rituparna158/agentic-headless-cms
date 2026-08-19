import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { apiClient } from './client';
import { ApiResponse } from '../types/api';
export const requestHandler = {
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
      // Global error handling can be enhanced here (e.g., toast notifications)
      throw handleApiError(error);
    }
  },
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
function handleApiError(error: unknown) {
  let message = 'An unexpected error occurred';
  let status = 500;
  if (axios.isAxiosError(error)) {
    message = error.response?.data?.message || error.message || message;
    status = error.response?.status || status;
  } else if (error instanceof Error) {
    message = error.message;
  }
  return {
    message,
    status,
    success: false,
    originalError: error,
  };
}
