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
