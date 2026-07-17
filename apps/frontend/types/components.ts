import type { ContentEntryRecord } from '@/lib/api/content';
import type { SchemaRecord } from '@/lib/api/schemas';

export interface ContentEntryFormProps {
  schema: SchemaRecord;
  /** Omit when creating a new entry. */
  entry?: ContentEntryRecord;
}

export interface VersionHistoryDrawerProps {
  schemaSlug: string;
  entryId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentEntry: ContentEntryRecord;
}

export interface UsersTabProps {
  isAdmin?: boolean;
}
