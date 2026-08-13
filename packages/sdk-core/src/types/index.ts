import type { AuthenticatedUser } from '@repo/types';

export interface ClientConfig {
  baseUrl: string;
  apiToken?: string;
}

export interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
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
