import type { ActorFilterType, SelectOption } from '../types/audit.types';

export const DEFAULT_AUDIT_PAGE = 1;
export const DEFAULT_AUDIT_PAGE_SIZE = 15;
export const CLIPBOARD_COPY_TIMEOUT_MS = 2000;

export const PAGE_SIZE_OPTIONS: number[] = [10, 15, 25, 50, 100];

export const ACTION_OPTIONS: SelectOption<string>[] = [
  { value: '', label: 'All Actions' },
  { value: 'create', label: 'Created' },
  { value: 'update', label: 'Updated' },
  { value: 'publish', label: 'Published' },
  { value: 'unpublish', label: 'Unpublished' },
  { value: 'delete', label: 'Deleted' },
  { value: 'rollback', label: 'Rolled Back' },
  { value: 'login', label: 'Logged In' },
  { value: 'schema_change', label: 'Schema Change' },
];

export const RESOURCE_OPTIONS: SelectOption<string>[] = [
  { value: '', label: 'All Resources' },
  { value: 'content', label: 'Content Entries' },
  { value: 'schema', label: 'Schemas' },
  { value: 'user', label: 'Users' },
  { value: 'role', label: 'Roles' },
  { value: 'media', label: 'Media Assets' },
  { value: 'webhook', label: 'Webhooks' },
  { value: 'locale', label: 'Locales' },
];

export const ACTOR_TYPE_OPTIONS: SelectOption<ActorFilterType>[] = [
  { value: 'all', label: 'All Actors' },
  { value: 'user', label: 'Human Users' },
  { value: 'agent', label: 'AI Agents' },
  { value: 'system', label: 'Automated System' },
];

export const RESOURCE_TYPE_LABELS: Record<string, string> = {
  content: 'Content Entry',
  schema: 'Content Schema',
  role: 'Access Role',
  user: 'User Profile',
  locale: 'Language / Locale',
  webhook: 'Webhook Endpoint',
  media: 'Media Asset',
  auth: 'Authentication',
};

export const IGNORED_DIFF_KEYS = new Set([
  'updatedAt',
  'createdAt',
  'version',
  'id',
  'applicationId',
]);
