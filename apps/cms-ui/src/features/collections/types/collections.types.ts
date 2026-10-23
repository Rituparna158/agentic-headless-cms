import type React from 'react';
import type { PageBuilderDesign } from '@mindfiredigital/page-builder-react';

export type ViewMode = 'grid' | 'list';

export type DeleteMode = 'normal' | 'conflict' | 'force';

export interface CollectionToDelete {
  id: string;
  name: string;
}

export interface CollectionToEdit {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
}

export interface PageToDelete {
  id: string;
  title: string;
}

export interface CollectionsTableState {
  page: number;
  pageSize: number;
  search: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface EntriesTableState {
  page: number;
  pageSize: number;
  search: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface CreatePageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  schemaSlug: string;
}

export interface CustomBuilderEditorProps {
  id: string;
  initialDesign: PageBuilderDesign | undefined;
  onChange: (design: PageBuilderDesign) => void;
  title: string;
}

export interface CustomBuilderPreviewProps {
  slug: string;
  initialDesign: PageBuilderDesign | undefined;
  title: string;
}

export interface PageBuilderSettingProps {
  targetComponentId: string;
}

export type PreviewDeviceType = 'desktop' | 'tablet' | 'mobile';

export interface CmsSchemaField {
  id?: string;
  name?: string;
  apiId: string;
  dataType?: string;
}

export interface CmsPageSchema {
  id: string;
  name: string;
  slug: string;
  fields?: CmsSchemaField[];
}

export interface CustomBlocksPluginOptions {
  schemaFields?: CmsSchemaField[];
  availableSchemas?: CmsPageSchema[];
  schemaValues?: Record<string, unknown>;
}

export interface GrapesJSData {
  builder: 'grapesjs';
  projectData?: Record<string, unknown>;
  html?: string;
  css?: string;
  components?: unknown;
  styles?: unknown;
}

export interface GrapesJSEditorHandle {
  loadTemplate: (result: unknown, action: 'replace' | 'append') => void;
  loadRawData: (data: Partial<GrapesJSData>) => void;
  isCanvasEmpty: () => boolean;
  getEditor: () => unknown;
}

export interface GrapesJSEditorProps {
  initialData?: Partial<GrapesJSData>;
  onChange: (data: GrapesJSData) => void;
  brandTitle?: string;
  schemaFields?: CmsSchemaField[];
  availableSchemas?: Array<{
    id: string;
    name: string;
    slug: string;
    fields?: unknown[];
  }>;
  schemaValues?: Record<string, unknown>;
}

import type {
  SchemaField,
  PaginationMeta,
  AuthenticatedUser,
} from '@repo/types';

export interface SchemaEntry {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  type: 'collection' | 'single_type' | 'component';
  status?: string;
  entryCount?: number;
  lastUpdatedBy?: string | null;
  fields: SchemaField[];
  createdAt: string;
  updatedAt: string;
}

export type PageBodyData = Record<string, unknown> | string | null | undefined;

export interface PageEntryData {
  title: string;
  slug: string;
  description?: string;
  body?: PageBodyData;
  [key: string]: unknown;
}

export interface PageEntry {
  id: string;
  schemaId?: string;
  locale?: string;
  status: 'draft' | 'published';
  data: PageEntryData;
  publishedData?: unknown;
  publishedAt?: string | null;
  updatedBy?: string | null;
  collaborators?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    pagination: PaginationMeta;
  };
}

export type { RequestOptions } from '@/types/api';

export interface CanvasDraftRecord {
  pageId: string;
  schemaSlug: string;
  title: string;
  slug: string;
  body: unknown;
  updatedAt: number;
  isDirty: boolean;
  builderType: 'grapesjs' | 'custom';
  componentState?: Record<string, unknown>;
}

export interface ExtractedCustomSchemaField {
  apiId: string;
  displayName?: string;
  name?: string;
  dataType?: string;
}

export interface ExtractedCustomSchema {
  id: string;
  name: string;
  slug: string;
  fields: ExtractedCustomSchemaField[];
}

export interface CanvasSchemaField {
  id: string;
  name: string;
  apiId: string;
  dataType?: string;
}

export interface CanvasAvailableSchema {
  id: string;
  name: string;
  slug: string;
  fields: Array<{
    id: string;
    name: string;
    apiId: string;
    dataType?: string;
  }>;
}

export interface DeleteCollectionModalProps {
  collection: CollectionToDelete | null;
  deleteMode: DeleteMode;
  forceDeleteConfirmName: string;
  onForceDeleteConfirmNameChange: (val: string) => void;
  onEnterForceMode: () => void;
  onConfirmDelete: () => void;
  onClose: () => void;
  isPending: boolean;
  isError: boolean;
}

export interface CollectionStats {
  total: number;
  totalEntries: number;
  published: number;
  drafts: number;
  publishRate: number;
  collaborators: Array<{
    id: string;
    name: string;
    initials: string;
  }>;
}

export interface CollectionsStatsCardsProps {
  stats: CollectionStats;
}

export interface EntryStats {
  total: number;
  published: number;
  drafts: number;
  publishRate: number;
  pagesWithSchemasCount: number;
}

export interface CollectionEntriesStatsCardsProps {
  stats: EntryStats;
}

export interface CollectionsGridViewProps {
  collections: SchemaEntry[];
  currentUser: AuthenticatedUser | null;
  onEdit: (collection: CollectionToEdit) => void;
  onDelete: (collection: CollectionToDelete) => void;
}

export interface CollectionEntriesGridViewProps {
  pages: PageEntry[];
  schemaSlug: string;
  search: string;
  onSearchChange: (search: string) => void;
  page: number;
  pageSize: number;
  totalCount: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  currentUser: AuthenticatedUser | null;
  pageAuthorMap: Map<string, { name: string; email: string }>;
  onOpenDrawer: (page: PageEntry) => void;
  onDeletePage: (item: { id: string; title: string }) => void;
}

export interface CreateCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  onNameChange: (val: string) => void;
  slug: string;
  onSlugChange: (val: string) => void;
  description: string;
  onDescriptionChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
  isError: boolean;
}

export interface EditCollectionModalProps {
  collection: CollectionToEdit | null;
  onClose: () => void;
  onCollectionChange: (updated: CollectionToEdit) => void;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
  isError: boolean;
}
