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
