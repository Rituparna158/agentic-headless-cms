/**
 * Unified TanStack Query keys.
 * Strictly pure data constants - ZERO JSX.
 */

export const QUERY_KEYS = {
  auth: {
    session: ['auth', 'session'] as const,
    user: ['auth', 'user'] as const,
  },
  sites: {
    all: ['sites'] as const,
    detail: (siteId: string) => ['sites', siteId] as const,
    config: (siteId: string) => ['sites', siteId, 'config'] as const,
    theme: (siteId: string) => ['sites', siteId, 'theme'] as const,
  },
  collections: {
    all: ['collections'] as const,
    detail: (id: string) => ['collections', id] as const,
    entries: (collectionId: string, params?: Record<string, unknown>) =>
      ['entries', collectionId, params ?? {}] as const,
    entry: (collectionId: string, entryId: string) =>
      ['entries', collectionId, entryId] as const,
    history: (collectionId: string, entryId: string) =>
      ['entries', collectionId, entryId, 'history'] as const,
  },
  posts: {
    all: (siteId?: string) => ['posts', { siteId }] as const,
    detail: (id: string) => ['posts', id] as const,
  },
  audit: {
    logs: (params?: Record<string, unknown>) =>
      ['audit-logs', params ?? {}] as const,
  },
  users: {
    all: ['users'] as const,
    detail: (userId: string) => ['users', userId] as const,
    roles: ['roles'] as const,
    mfaRequests: ['mfa-requests'] as const,
  },
  media: {
    all: (params?: Record<string, unknown>) => ['media', params ?? {}] as const,
    detail: (id: string) => ['media', id] as const,
  },
  menus: {
    all: (siteId: string) => ['menus', siteId] as const,
  },
} as const;
