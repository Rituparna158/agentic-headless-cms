export const ERROR_MESSAGES = {
  AUTH: {
    UNAUTHORIZED: 'Unauthorized',
    NOT_AUTHENTICATED: 'Unauthorized: User not authenticated',
    NO_TOKEN: 'Unauthorized: No token provided',
    INVALID_TOKEN: 'Unauthorized: Invalid token',
    INVALID_CREDENTIALS: 'Invalid email or password',
  },
  RBAC: {
    FORBIDDEN: 'Forbidden: Insufficient permissions',
  },
  CONTENT: {
    ENTRY_NOT_FOUND: 'Entry not found',
    INVALID_VERSION_NO: 'Invalid versionNo',
    FAILED_TO_CREATE_ENTRY: 'Failed to create entry',
  },
  MEDIA: {
    ASSET_NOT_FOUND: 'Media asset not found',
    NO_FILE_UPLOADED:
      'No file was uploaded. Attach one under the "file" field.',
    INVALID_RESIZE_PARAMS: 'Invalid resize query params',
  },
} as const;

export const DEFAULT_LOCALE = 'en';

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export const AUTH_COOKIES = {
  NAME: 'token',
  MAX_AGE_MS: 24 * 60 * 60 * 1000, // 1 day
} as const;
