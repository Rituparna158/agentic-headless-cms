export const API_PATHS = {
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    LOGOUT: '/api/v1/auth/logout',
    ME: '/api/v1/auth/me',
    ACCEPT_INVITE: '/api/v1/auth/accept-invite',
    SSO: '/api/v1/auth/sso',
  },
  ACCESS: {
    ROLES: '/api/v1/access/roles',
    ROLE: (id: string) => `/api/v1/access/roles/${id}`,
    USERS: '/api/v1/access/users',
    INVITE: '/api/v1/access/users/invite',
    TOKENS: '/api/v1/access/tokens',
    TOKEN: (id: string) => `/api/v1/access/tokens/${id}`,
  },
  SCHEMAS: {
    BASE: '/api/v1/schemas',
    BY_ID: (id: string, force?: boolean) =>
      `/api/v1/schemas/${id}${force ? '?force=true' : ''}`,
  },
  MEDIA: {
    BASE: (qs?: string) => `/api/v1/media${qs ? `?${qs}` : ''}`,
    BY_ID: (id: string) => `/api/v1/media/${id}`,
  },
  WEBHOOKS: {
    BASE: '/api/v1/webhooks',
    BY_ID: (id: string) => `/api/v1/webhooks/${id}`,
  },
  LOCALES: {
    BASE: '/api/v1/locales',
    BY_ID: (id: string) => `/api/v1/locales/${id}`,
  },
  CONTENT: {
    BASE: (schemaSlug: string, qs?: string) =>
      `/api/v1/content/${schemaSlug}${qs ? `?${qs}` : ''}`,
    BY_ID: (schemaSlug: string, entryId: string) =>
      `/api/v1/content/${schemaSlug}/${entryId}`,
    PUBLISH: (schemaSlug: string, entryId: string) =>
      `/api/v1/content/${schemaSlug}/${entryId}/publish`,
    REVERT: (schemaSlug: string, entryId: string) =>
      `/api/v1/content/${schemaSlug}/${entryId}/revert`,
    VERSIONS: (schemaSlug: string, entryId: string) =>
      `/api/v1/content/${schemaSlug}/${entryId}/versions`,
  },
} as const;
