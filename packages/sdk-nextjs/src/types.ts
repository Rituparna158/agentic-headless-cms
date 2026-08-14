export interface NextFetchOptions {
  tags: string[];
  revalidate?: number | false;
}

export interface FetchConfig {
  baseUrl: string;
  apiToken: string;
}

export interface CmsMetadata {
  title?: string | null;
  description?: string | null;
  openGraph?: {
    title?: string | null;
    description?: string | null;
    images?: { url: string }[];
  };
}
