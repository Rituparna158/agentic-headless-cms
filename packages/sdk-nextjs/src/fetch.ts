import type { FetchConfig, NextFetchOptions } from './types.js';
import { resolveEnvConfig } from './utils/config.js';

export type { NextFetchOptions, FetchConfig };

let _config: FetchConfig | null = null;

/** Returns the cached env config  */
export function getConfig(): FetchConfig {
  if (_config) return _config;
  _config = resolveEnvConfig();
  return _config;
}

/** Resets the cached config. Only used in tests. */
export function _resetConfig(): void {
  _config = null;
}

/** Calls the CMS REST API with Next.js fetch cache tags for ISR. */
export async function cmsServerFetch<T>(
  path: string,
  nextOptions?: NextFetchOptions,
  queryParams?: Record<string, string | number | boolean | undefined>,
  init?: Omit<RequestInit, 'next'>,
): Promise<T> {
  const { baseUrl, apiToken, appId, apiKey } = resolveEnvConfig();

  // Normalize baseUrl and path to avoid duplicate /api/v1 prefixes
  const normalizedBase = baseUrl.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const fullPath =
    normalizedBase.endsWith('/api/v1') && normalizedPath.startsWith('/api/v1')
      ? normalizedPath.slice(7)
      : normalizedPath;

  const url = new URL(`${normalizedBase}${fullPath}`);

  if (queryParams) {
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined) url.searchParams.set(key, String(value));
    });
  }

  const headers = new Headers({
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiToken}`,
    ...init?.headers,
  });

  if (appId && !headers.has('x-app-id')) {
    headers.set('x-app-id', appId);
  }
  if (apiKey && !headers.has('x-api-key')) {
    headers.set('x-api-key', apiKey);
  }

  const fetchOptions: RequestInit & { next?: NextFetchOptions } = {
    ...init,
    method: init?.method ?? 'GET',
    headers,
    next: nextOptions,
  };

  const response = await fetch(url.toString(), fetchOptions);

  if (!response.ok) {
    let message = response.statusText;
    try {
      const body = (await response.json()) as { message?: string };
      if (body.message) message = body.message;
    } catch {
      /* use statusText */
    }
    throw new Error(`[sdk-nextjs] ${response.status}: ${message} (${path})`);
  }

  const json = (await response.json()) as { data: T };
  return json.data;
}
