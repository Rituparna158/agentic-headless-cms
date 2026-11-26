import type { DynamicFieldDefinition, PageEntry } from '@/types/content.types';
import type { BlogShowcaseLayout } from '../constants/blogTypes';

export type { BlogShowcaseLayout };
export type BlogPostStatus = 'draft' | 'published';

export interface BlogPost extends Record<string, unknown> {
  id: string;
  slug: string;
  title: string;
  status: BlogPostStatus;
  createdAt?: string;
  updatedAt?: string;
  /** Still stored inside the blog page's JSON; moved to its own entry on migrate. */
  legacy?: boolean;
}

/** A blog type as stored on the site: one page holding one multi-entry schema. */
export interface BlogPage {
  pageId: string;
  typeId: string;
  name: string;
  postLabel: string;
  pageSlug: string;
  pageStatus: string;
  fields: DynamicFieldDefinition[];
  posts: BlogPost[];
  page: PageEntry;
}

export interface BlogTypeDefinition {
  id: string;
  name: string;
  /** Singular label used in buttons, e.g. "New Engineering post". */
  postLabel: string;
  description: string;
  emoji: string;
  fields: DynamicFieldDefinition[];
}

export interface BlogFieldInput {
  apiId: string;
  label: string;
  type: DynamicFieldDefinition['dataType'];
  required?: boolean;
  help?: string;
  options?: string[];
}

export interface ImportedPost {
  title?: string;
  slug?: string;
  excerpt?: string;
  author?: string;
  date?: string;
  tags: string[];
  /** The article as HTML, ready for the editor. */
  content: string;
}

export interface BlogSetupPanelProps {
  siteSlug: string;
  urlPrefix: string;
  onUrlPrefixChange: (value: string) => void;
  canCreateCustom: boolean;
}

export interface BlogTypePickerProps {
  selected: string[];
  onChange: (ids: string[]) => void;
  /** Types that already exist; shown as added and not selectable. */
  existingIds?: string[];
}

export interface CustomBlogTypeDialogProps {
  existingIds: string[];
  isSaving: boolean;
  onClose: () => void;
  onCreate: (def: {
    id: string;
    name: string;
    postLabel: string;
    fields: DynamicFieldDefinition[];
    layout?: BlogShowcaseLayout;
  }) => void;
}

export interface FeatureBlogDialogProps {
  blogName: string;
  /** Pages that can receive the section (not the blog's own page). */
  pages: PageEntry[];
  isSaving: boolean;
  onClose: () => void;
  onConfirm: (opts: { pageId: string; title: string; limit: number }) => void;
}

export interface PostExtrasDockProps {
  siteId: string;
  /** Every entry of the website (used to list tags). */
  entries: PageEntry[];
  values: Record<string, unknown>;
  setValue: (apiId: string, value: unknown) => void;
  /** Slugs of the other posts of this blog, to warn about a clash. */
  otherSlugs: string[];
  slug: string;
  canPublish: boolean;
}
