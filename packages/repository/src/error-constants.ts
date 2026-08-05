export const REPO_ERRORS = {
  // General DB
  DB_FETCH_FAILED: 'Failed to fetch record(s) from the database',
  DB_INSERT_FAILED: 'Failed to insert record into the database',
  DB_UPDATE_FAILED: 'Failed to update record in the database',
  DB_DELETE_FAILED: 'Failed to delete record from the database',
  DB_COUNT_FAILED: 'Failed to count records in the database',

  // Access
  FETCH_POLICY_FAILED: 'Failed to fetch policy',
  CREATE_POLICY_FAILED: 'Failed to create policy',
  UPDATE_POLICY_FAILED: 'Failed to update policy',
  DELETE_POLICY_FAILED: 'Failed to delete policy',
  FETCH_ROLES_FAILED: 'Failed to fetch roles',
  CREATE_ROLE_FAILED: 'Failed to create role',
  UPDATE_ROLE_FAILED: 'Failed to update role',
  DELETE_ROLE_FAILED: 'Failed to delete role',
  FETCH_PERMISSIONS_FAILED: 'Failed to fetch permissions',
  ASSIGN_PERMISSION_FAILED: 'Failed to assign permission',
  REMOVE_PERMISSION_FAILED: 'Failed to remove permission',

  // Audit
  CREATE_AUDIT_LOG_FAILED: 'Failed to create audit log',
  FETCH_AUDIT_LOGS_FAILED: 'Failed to fetch audit logs',

  // Auth
  FETCH_USER_FAILED: 'Failed to fetch user',
  ACTIVATE_USER_FAILED: 'Failed to activate user',
  FETCH_USER_ROLES_FAILED: 'Failed to fetch user roles',
  FETCH_USER_PERMISSIONS_FAILED: 'Failed to fetch user permissions',

  // Content
  FETCH_SCHEMA_FAILED: 'Failed to fetch schema by slug',
  LIST_ENTRIES_FAILED: 'Failed to list entries',
  COUNT_ENTRIES_FAILED: 'Failed to count entries',
  FETCH_ENTRY_FAILED: 'Failed to fetch entry by ID',
  CREATE_ENTRY_FAILED: 'Failed to create entry',
  UPDATE_ENTRY_FAILED: 'Failed to update entry draft',
  PUBLISH_ENTRY_FAILED: 'Failed to publish entry',
  REVERT_ENTRY_FAILED: 'Failed to revert entry',
  LIST_ENTRY_VERSIONS_FAILED: 'Failed to list entry versions',
  DELETE_ENTRY_FAILED: 'Failed to delete entry',

  // Locales
  LIST_LOCALES_FAILED: 'Failed to list locales',
  CREATE_LOCALE_FAILED: 'Failed to create locale',
  UPDATE_LOCALE_FAILED: 'Failed to update locale',
  DELETE_LOCALE_FAILED: 'Failed to delete locale',
  SET_DEFAULT_LOCALE_FAILED: 'Failed to set default locale',

  // Media
  LIST_MEDIA_FAILED: 'Failed to list media',
  CREATE_MEDIA_FAILED: 'Failed to create media',
  UPDATE_MEDIA_FAILED: 'Failed to update media',
  DELETE_MEDIA_FAILED: 'Failed to delete media',
  FETCH_MEDIA_FAILED: 'Failed to fetch media',

  // Schema
  LIST_SCHEMAS_FAILED: 'Failed to list schemas',
  CREATE_SCHEMA_FAILED: 'Failed to create schema',
  UPDATE_SCHEMA_FAILED: 'Failed to update schema',
  DELETE_SCHEMA_FAILED: 'Failed to delete schema',

  // Webhooks
  LIST_WEBHOOKS_FAILED: 'Failed to list webhooks',
  CREATE_WEBHOOK_FAILED: 'Failed to create webhook',
  UPDATE_WEBHOOK_FAILED: 'Failed to update webhook',
  DELETE_WEBHOOK_FAILED: 'Failed to delete webhook',
  FETCH_WEBHOOK_FAILED: 'Failed to fetch webhook',
};
