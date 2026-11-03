export const EVENT_NAMES = {
  AUDIT_LOG: 'audit.log',
  MEDIA_UPLOADED: 'media.uploaded',
} as const;

export const AUDIT_ACTIONS = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  PUBLISH: 'publish',
  UNPUBLISH: 'unpublish',
  ROLLBACK: 'rollback',
  LOGIN: 'login',
  SCHEMA_CHANGE: 'schema_change',
} as const;

export const AUDIT_ACTION_LIST = [
  'create',
  'update',
  'publish',
  'delete',
  'rollback',
  'unpublish',
  'login',
  'schema_change',
] as const;

export const AUDIT_ACTIONS_ARRAY = AUDIT_ACTION_LIST;

export const RESOURCE_TYPES = [
  'content',
  'schema',
  'role',
  'user',
  'locale',
  'webhook',
  'media',
  'api_token',
] as const;

export const AUDIT_RESOURCE_TYPES = RESOURCE_TYPES;
