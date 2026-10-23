export const ENTRIES_VIEW_MODE_STORAGE_KEY = 'cms:entries:viewMode';
export const COLLECTIONS_VIEW_MODE_STORAGE_KEY = 'cms:collections:viewMode';

export const DEFAULT_COLLECTION_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_STATS_PAGE_SIZE = 100;

export const DEFAULT_ENTRY_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800';

export const DEFAULT_PRODUCT_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800';

export const FALLBACK_AUTHOR_NAME = 'Author';
export const DEFAULT_DYNAMIC_CONTENT_TITLE = 'Universal Showcase Product';

import type { SchemaField } from '@repo/types';

export const DEFAULT_PAGE_FIELDS: SchemaField[] = [
  {
    apiId: 'title',
    displayName: 'Title',
    dataType: 'text',
    isRequired: true,
    isUnique: false,
    isLocalized: true,
    isRepeatable: false,
    sortOrder: 0,
  },
  {
    apiId: 'slug',
    displayName: 'Slug',
    dataType: 'text',
    isRequired: true,
    isUnique: true,
    isLocalized: false,
    isRepeatable: false,
    sortOrder: 1,
  },
  {
    apiId: 'description',
    displayName: 'Description',
    dataType: 'text',
    isRequired: false,
    isUnique: false,
    isLocalized: true,
    isRepeatable: false,
    sortOrder: 2,
  },
  {
    apiId: 'body',
    displayName: 'Body',
    dataType: 'json',
    isRequired: false,
    isUnique: false,
    isLocalized: true,
    isRepeatable: false,
    sortOrder: 4,
  },
];

export const CANVAS_DRAFT_DB_NAME = 'cms_builder_offline_storage';
export const CANVAS_DRAFT_DB_VERSION = 1;
export const CANVAS_DRAFT_STORE_NAME = 'canvas_drafts';
export const CANVAS_AUTO_SAVE_INTERVAL_MS = 15000;
export const CANVAS_STALE_DRAFT_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000;

import type { AdvancedTableColumn } from '@repo/shared-ui';

export const COLLECTIONS_LIST_TABLE_COLUMNS: AdvancedTableColumn[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'description', label: 'Description', sortable: false },
  { key: 'status', label: 'Status', sortable: false },
  { key: 'entries', label: 'Entries', sortable: false },
  { key: 'updatedAt', label: 'Last Updated', sortable: true },
  { key: 'updatedBy', label: 'Updated By', sortable: false },
  {
    key: 'actions',
    label: 'Actions',
    sortable: false,
    align: 'right',
  },
];

export const COLLECTION_ENTRIES_TABLE_COLUMNS: AdvancedTableColumn[] = [
  { key: 'name', label: 'Page Title & Slug', sortable: true },
  { key: 'schema', label: 'Schema Slots', sortable: false },
  { key: 'status', label: 'Status', sortable: false },
  { key: 'updatedAt', label: 'Last Updated', sortable: true },
  { key: 'updatedBy', label: 'Author', sortable: false },
  {
    key: 'actions',
    label: 'Actions',
    sortable: false,
    align: 'right',
  },
];
