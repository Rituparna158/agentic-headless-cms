export interface ClientConfig {
  baseUrl: string;
  apiToken?: string;
}

export interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}
