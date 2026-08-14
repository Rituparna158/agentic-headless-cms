import { pgEnum } from 'drizzle-orm/pg-core';

export const actorTypeEnum = pgEnum('actor_type', ['user', 'agent', 'system']);
export const tokenTypeEnum = pgEnum('token_type', ['user', 'agent']);
export const userStatusEnum = pgEnum('user_status', [
  'active',
  'invited',
  'suspended',
]);
export const mfaResetRequestStatusEnum = pgEnum('mfa_reset_request_status', [
  'pending',
  'approved',
  'rejected',
  'completed',
  'expired',
]);
export const schemaTypeEnum = pgEnum('schema_type', [
  'collection',
  'single_type',
  'component',
]);
export const schemaStatusEnum = pgEnum('schema_status', ['draft', 'published']);
export const versionStatusEnum = pgEnum('version_status', [
  'draft',
  'published',
  'archived',
]);
export const relationKindEnum = pgEnum('relation_kind', [
  'one_to_one',
  'one_to_many',
  'many_to_many',
  'polymorphic',
]);
export const approvalStatusEnum = pgEnum('approval_status', [
  'pending',
  'approved',
  'rejected',
]);
export const permissionActionEnum = pgEnum('permission_action', [
  '*',
  'read',
  'create',
  'update',
  'delete',
  'publish',
  'manage',
]);
export const permissionEffectEnum = pgEnum('permission_effect', [
  'allow',
  'deny',
]);
export const auditActionEnum = pgEnum('audit_action', [
  'create',
  'update',
  'delete',
  'publish',
  'unpublish',
  'rollback',
  'login',
  'schema_change',
]);

export const applicationTypeEnum = pgEnum('application_type', [
  'HEADLESS_CMS',
  'CMS_UI',
]);

export const appAccessStatusEnum = pgEnum('app_access_status', [
  'invited',
  'active',
  'revoked',
]);
