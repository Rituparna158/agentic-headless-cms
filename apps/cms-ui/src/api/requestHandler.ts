import axios, { AxiosResponse } from 'axios';
import { z } from 'zod';
import { apiClient } from './client';
import { ApiResponse } from '../types/api';
import { RequestConfig } from '../types/requestHandler.types';

// Represents an API response contract violation error.
export class ApiContractError extends Error {
  issues: z.core.$ZodIssue[];
  endpointLabel?: string;

  constructor(issues: z.core.$ZodIssue[], endpointLabel?: string) {
    const summary = issues
      .map((i) => `${i.path.join('.') || 'root'}: ${i.message}`)
      .join('; ');
    super(
      `API response contract validation failed${endpointLabel ? ` for [${endpointLabel}]` : ''}: ${summary}`,
    );
    this.name = 'ApiContractError';
    this.issues = issues;
    this.endpointLabel = endpointLabel;
    Object.setPrototypeOf(this, ApiContractError.prototype);
  }
}

// Validates a response payload against a Zod schema.
export function validateResponse<T>(
  data: unknown,
  schema: z.ZodType<T>,
  endpointLabel?: string,
): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.warn(
      `[API Contract Error] Validation failed${endpointLabel ? ` for [${endpointLabel}]` : ''}:`,
      result.error.issues,
    );
    throw new ApiContractError(result.error.issues, endpointLabel);
  }
  return result.data;
}

// Centralized HTTP client wrapper providing type-safe request dispatching, schema validation, and normalized error handling.
export const requestHandler = {
  // Dispatches an HTTP GET request and returns typed, contract-validated response data.
  get: async <T>(
    url: string,
    config?: RequestConfig<T>,
  ): Promise<ApiResponse<T>> => {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await apiClient.get(
        url,
        config,
      );
      if (config?.schema) {
        response.data.data = validateResponse(
          response.data.data,
          config.schema,
          config.endpointLabel || url,
        );
      }
      return response.data;
    } catch (error: unknown) {
      throw handleApiError(error);
    }
  },

  // Dispatches an HTTP POST request with an optional payload and returns typed response data.
  post: async <T, D = unknown>(
    url: string,
    data?: D,
    config?: RequestConfig<T>,
  ): Promise<ApiResponse<T>> => {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await apiClient.post(
        url,
        data,
        config,
      );
      if (config?.schema) {
        response.data.data = validateResponse(
          response.data.data,
          config.schema,
          config.endpointLabel || url,
        );
      }
      return response.data;
    } catch (error: unknown) {
      throw handleApiError(error);
    }
  },

  // Dispatches an HTTP PUT request with an update payload and returns typed response data.
  put: async <T, D = unknown>(
    url: string,
    data?: D,
    config?: RequestConfig<T>,
  ): Promise<ApiResponse<T>> => {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await apiClient.put(
        url,
        data,
        config,
      );
      if (config?.schema) {
        response.data.data = validateResponse(
          response.data.data,
          config.schema,
          config.endpointLabel || url,
        );
      }
      return response.data;
    } catch (error: unknown) {
      throw handleApiError(error);
    }
  },

  // Dispatches an HTTP DELETE request and returns typed response data.
  delete: async <T>(
    url: string,
    config?: RequestConfig<T>,
  ): Promise<ApiResponse<T>> => {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await apiClient.delete(
        url,
        config,
      );
      if (config?.schema) {
        response.data.data = validateResponse(
          response.data.data,
          config.schema,
          config.endpointLabel || url,
        );
      }
      return response.data;
    } catch (error: unknown) {
      throw handleApiError(error);
    }
  },

  // Dispatches an HTTP PATCH request for partial updates and returns typed response data.
  patch: async <T, D = unknown>(
    url: string,
    data?: D,
    config?: RequestConfig<T>,
  ): Promise<ApiResponse<T>> => {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await apiClient.patch(
        url,
        data,
        config,
      );
      if (config?.schema) {
        response.data.data = validateResponse(
          response.data.data,
          config.schema,
          config.endpointLabel || url,
        );
      }
      return response.data;
    } catch (error: unknown) {
      throw handleApiError(error);
    }
  },
};

// Represents a normalized API error containing HTTP status, message, cancellation state, and backend validation details.
export class ApiRequestError extends Error {
  status: number;
  success: boolean;
  isCanceled: boolean;
  errors?: unknown;
  originalError: unknown;

  constructor(
    message: string,
    status = 500,
    errors?: unknown,
    originalError?: unknown,
    isCanceled = false,
  ) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.success = false;
    this.isCanceled = isCanceled;
    this.errors = errors;
    this.originalError = originalError;
    Object.setPrototypeOf(this, ApiRequestError.prototype);
  }
}

// Inspects and normalizes Axios errors or native errors into an ApiRequestError or ApiContractError instance.
export function handleApiError(error: unknown) {
  if (error instanceof ApiContractError) {
    return error;
  }
  if (error instanceof ApiRequestError) {
    return error;
  }

  if (
    axios.isCancel(error) ||
    (error instanceof Error &&
      (error.name === 'CanceledError' || error.name === 'AbortError'))
  ) {
    return new ApiRequestError('Request canceled', 0, undefined, error, true);
  }

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

  return new ApiRequestError(message, status, validationErrors, error, false);
}
