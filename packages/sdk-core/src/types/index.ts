import type { AuthenticatedUser } from '@repo/types';

export interface RetryConfig {
  retries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffFactor?: number;
  statusCodes?: number[];
}

export interface ClientConfig {
  baseUrl: string;
  apiToken?: string;
  appId?: string;
  apiKey?: string;
  headers?: Record<string, string>;
  retry?: RetryConfig | boolean;
}

export interface FetchOptions extends RequestInit {
  params?: Record<string, unknown>;
  retry?: RetryConfig | boolean;
}

export interface ApiResponse<T> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
}

export interface UploadMediaOptions {
  altText?: string;
  folderId?: string;
  filename?: string;
}

export type LoginResult =
  | AuthenticatedUser
  | { mfaRequired: true; mfaToken: string };

export interface SearchOptions {
  locale?: string;
  page?: number;
  pageSize?: number;
}

export interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string; [key: string]: unknown }>;
}
