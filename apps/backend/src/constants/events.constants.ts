export const EVENT_NAMES = {
  AUDIT_LOG: 'audit.log',
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
