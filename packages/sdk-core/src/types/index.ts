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
}
