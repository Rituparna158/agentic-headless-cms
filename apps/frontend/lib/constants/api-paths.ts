export const API_PATHS = {
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    LOGOUT: '/api/v1/auth/logout',
    ME: '/api/v1/auth/me',
    ACCEPT_INVITE: '/api/v1/auth/accept-invite',
    SSO: '/api/v1/auth/sso',
    MFA_ENROLL: '/api/v1/auth/mfa/enroll',
    MFA_VERIFY: '/api/v1/auth/mfa/verify',
    MFA_CHALLENGE: '/api/v1/auth/mfa/challenge',
    MFA_DISABLE: '/api/v1/auth/mfa/disable',
    MFA_RESET_REQUEST: '/api/v1/auth/mfa/reset-request',
    MFA_RESET_COMPLETE: '/api/v1/auth/mfa/reset-complete',
    FORGOT_PASSWORD: '/api/v1/auth/forgot-password',
    RESET_PASSWORD: '/api/v1/auth/reset-password',
  },
  ACCESS: {
    ROLES: '/api/v1/access/roles',
    ROLE: (id: string) => `/api/v1/access/roles/${id}`,
    USERS: '/api/v1/access/users',
    USER: (id: string) => `/api/v1/access/users/${id}`,
    USER_ROLE: (id: string) => `/api/v1/access/users/${id}/role`,
    INVITE: '/api/v1/access/users/invite',
    TOKENS: '/api/v1/access/tokens',
    TOKEN: (id: string) => `/api/v1/access/tokens/${id}`,
    MFA_REQUESTS: '/api/v1/access/mfa-requests',
    MFA_REQUEST_APPROVE: (id: string) =>
      `/api/v1/access/mfa-requests/${id}/approve`,
    MFA_REQUEST_REJECT: (id: string) =>
      `/api/v1/access/mfa-requests/${id}/reject`,
  },
  SCHEMAS: {
    BASE: '/api/v1/schemas',
    BY_ID: (id: string, force?: boolean) =>
      `/api/v1/schemas/${id}${force ? '?force=true' : ''}`,
  },
  MEDIA: {
    BASE: (qs?: string) => `/api/v1/media${qs ? `?${qs}` : ''}`,
    BY_ID: (id: string) => `/api/v1/media/${id}`,
    BULK_DELETE: '/api/v1/media/bulk-delete',
  },
  WEBHOOKS: {
    BASE: '/api/v1/webhooks',
    BY_ID: (id: string) => `/api/v1/webhooks/${id}`,
    TEST: (id: string) => `/api/v1/webhooks/${id}/test`,
    DELIVERIES: (id: string) => `/api/v1/webhooks/${id}/deliveries`,
    RETRY_DELIVERY: (id: string, deliveryId: string) =>
      `/api/v1/webhooks/${id}/deliveries/${deliveryId}/retry`,
    REPLAY_DELIVERY: (id: string, deliveryId: string) =>
      `/api/v1/webhooks/${id}/deliveries/${deliveryId}/replay`,
  },
  LOCALES: {
    BASE: '/api/v1/locales',
    BY_ID: (id: string) => `/api/v1/locales/${id}`,
    SET_DEFAULT: (id: string) => `/api/v1/locales/${id}/default`,
  },
  CONTENT: {
    BASE: (schemaSlug: string, qs?: string) =>
      `/api/v1/content/${schemaSlug}${qs ? `?${qs}` : ''}`,
    BY_ID: (schemaSlug: string, entryId: string) =>
      `/api/v1/content/${schemaSlug}/${entryId}`,
    PUBLISH: (schemaSlug: string, entryId: string) =>
      `/api/v1/content/${schemaSlug}/${entryId}/publish`,
    UNPUBLISH: (schemaSlug: string, entryId: string) =>
      `/api/v1/content/${schemaSlug}/${entryId}/unpublish`,
    REVERT: (schemaSlug: string, entryId: string) =>
      `/api/v1/content/${schemaSlug}/${entryId}/revert`,
    VERSIONS: (schemaSlug: string, entryId: string) =>
      `/api/v1/content/${schemaSlug}/${entryId}/versions`,
    WORKFLOW_STATE: (schemaSlug: string, entryId: string) =>
      `/api/v1/content/${schemaSlug}/${entryId}/workflow-state`,
    WORKFLOW_MODE: (schemaSlug: string, entryId: string) =>
      `/api/v1/content/${schemaSlug}/${entryId}/workflow-mode`,
    TRANSITION: (schemaSlug: string, entryId: string) =>
      `/api/v1/content/${schemaSlug}/${entryId}/transition`,
    WORKFLOW_HISTORY: (schemaSlug: string, entryId: string) =>
      `/api/v1/content/${schemaSlug}/${entryId}/workflow-history`,
  },
  WORKFLOWS: {
    BASE: (qs?: string) => `/api/v1/workflows${qs ? `?${qs}` : ''}`,
    PENDING_REVIEWS: (limit?: number) =>
      `/api/v1/workflows/pending-reviews${limit ? `?limit=${limit}` : ''}`,
    BY_ID: (id: string) => `/api/v1/workflows/${id}`,
    ASSIGN_SCHEMA: (workflowId: string, schemaId: string) =>
      `/api/v1/workflows/${workflowId}/schemas/${schemaId}`,
    REMOVE_SCHEMA: (schemaId: string) =>
      `/api/v1/workflows/schemas/${schemaId}`,
    BY_SCHEMA: (schemaId: string) => `/api/v1/workflows/schema/${schemaId}`,
  },
  AUDIT_LOGS: {
    BASE: '/api/v1/audit-logs',
    BY_ID: (id: string) => `/api/v1/audit-logs/${id}`,
  },
} as const;
